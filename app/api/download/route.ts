// import { NextRequest, NextResponse } from "next/server";
// import { google } from "googleapis";
// import archiver from "archiver";
// import sharp from "sharp";

// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

// export async function POST(req: NextRequest) {
//   try {
//     const { files } = await req.json();

//     if (!files || !Array.isArray(files) || files.length === 0) {
//       return NextResponse.json({ error: "No files provided" }, { status: 400 });
//     }

//     if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
//       return NextResponse.json(
//         { error: "Service account key missing" },
//         { status: 500 },
//       );
//     }

//     // 1. Authenticate with the Service Account
//     const auth = new google.auth.GoogleAuth({
//       credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
//       scopes: ["https://www.googleapis.com/auth/drive.readonly"],
//     });

//     const drive = google.drive({ version: "v3", auth });

//     // 2. Setup Web Stream for the browser
//     const { readable, writable } = new TransformStream();
//     const writer = writable.getWriter();

//     const archive = archiver("zip", { zlib: { level: 9 } });

//     archive.on("data", (chunk) => writer.write(chunk));
//     archive.on("end", () => writer.close());
//     archive.on("error", (err) => {
//       console.error("Archive error:", err);
//       writer.abort(err);
//     });

//     // 3. Process files asynchronously
//     (async () => {
//       let appendedCount = 0;
//       let debugLog = "--- DOWNLOAD DIAGNOSTICS LOG ---\n\n";

//       for (const file of files) {
//         debugLog += `File: ${file.name} (${file.mimeType})\n`;

//         if (file.mimeType.startsWith("application/vnd.google-apps.")) {
//           debugLog += `-> SKIPPED: Google Workspace files (Docs/Sheets) cannot be downloaded raw.\n\n`;
//           continue;
//         }

//         try {
//           // Fetch file stream natively using the Google Drive SDK
//           const driveRes = await drive.files.get(
//             {
//               fileId: file.id,
//               alt: "media",
//               supportsAllDrives: true,
//               acknowledgeAbuse: true,
//             },
//             { responseType: "stream" }, // <--- This prevents memory crashes!
//           );

//           let fileName = file.name;

//           // Process Images through Sharp Stream
//           if (file.mimeType.startsWith("image/")) {
//             // fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
//             fileName = fileName.replace(/\.[^/.]+$/, "") + ".jpg";

//             // Create a sharp transform stream
//             // const sharpStream = sharp().webp({ quality: 50, effort: 6 });
//             const sharpStream = sharp().jpeg({ quality: 80, mozjpeg: true });
//             sharpStream.on("error", (err) =>
//               console.error(`Sharp error on ${file.id}:`, err),
//             );

//             // Pipe: Google Drive -> Sharp -> Zip Archive
//             archive.append(driveRes.data.pipe(sharpStream), { name: fileName });
//             debugLog += `-> SUCCESS: Streamed and compressed to JPEG.\n\n`;
//           } else {
//             // Process Non-Images (PDFs, Videos, etc)
//             // Pipe: Google Drive -> Zip Archive
//             archive.append(driveRes.data, { name: fileName });
//             debugLog += `-> SUCCESS: Streamed original file.\n\n`;
//           }

//           appendedCount++;
//           // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         } catch (err: any) {
//           debugLog += `-> FATAL ERROR: ${err.message}\n\n`;
//         }
//       }

//       if (appendedCount !== files.length) {
//         archive.append(debugLog, { name: "error_log.txt" });
//       }

//       await archive.finalize();
//     })();

//     return new NextResponse(readable, {
//       headers: {
//         "Content-Type": "application/zip",
//         "Content-Disposition": `attachment; filename="compressed_drive_files.zip"`,
//       },
//     });
//   } catch (err) {
//     console.error("[download/route] Fatal Error:", err);
//     return NextResponse.json(
//       { error: "Failed to create compressed archive." },
//       { status: 500 },
//     );
//   }
// }

// ------------------------ download all

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import archiver from "archiver";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Recursively fetches all non-folder files from a Drive folder
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAllFilesInFolder(drive: any, folderId: string) {
  const allFiles: { id: string; name: string; mimeType: string }[] = [];
  let pageToken: string | undefined = undefined;

  do {
    // @ts-expect-error random
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, size)",
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      ...(pageToken ? { pageToken } : {}),
    });

    const files = res.data.files ?? [];
    for (const file of files) {
      if (file.mimeType === "application/vnd.google-apps.folder") continue;
      allFiles.push({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
      });
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return allFiles;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json(
        { error: "Service account key missing" },
        { status: 500 },
      );
    }

    // 1. Authenticate
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });

    // 2. Resolve the file list — either passed directly or fetched from folderId
    let files: { id: string; name: string; mimeType: string }[];

    if (body.folderId) {
      files = await fetchAllFilesInFolder(drive, body.folderId);
      if (files.length === 0) {
        return NextResponse.json(
          { error: "No downloadable files found in this folder." },
          { status: 400 },
        );
      }
    } else if (Array.isArray(body.files) && body.files.length > 0) {
      files = body.files;
    } else {
      return NextResponse.json(
        { error: "No files or folderId provided." },
        { status: 400 },
      );
    }

    // After resolving `files`, calculate total size
    const totalSize = files.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc, f) => acc + (parseInt((f as any).size || "0", 10) || 0),
      0,
    );

    // 3. Setup Web Stream — everything below is identical to your existing logic
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("data", (chunk) => writer.write(chunk));
    archive.on("end", () => writer.close());
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      writer.abort(err);
    });

    (async () => {
      let appendedCount = 0;
      let debugLog = "--- DOWNLOAD DIAGNOSTICS LOG ---\n\n";

      for (const file of files) {
        debugLog += `File: ${file.name} (${file.mimeType})\n`;

        if (file.mimeType.startsWith("application/vnd.google-apps.")) {
          debugLog += `-> SKIPPED: Google Workspace files cannot be downloaded raw.\n\n`;
          continue;
        }

        try {
          const driveRes = await drive.files.get(
            {
              fileId: file.id,
              alt: "media",
              supportsAllDrives: true,
              acknowledgeAbuse: true,
            },
            { responseType: "stream" },
          );

          let fileName = file.name;

          if (file.mimeType.startsWith("image/")) {
            fileName = fileName.replace(/\.[^/.]+$/, "") + ".jpg";
            const sharpStream = sharp().jpeg({ quality: 80, mozjpeg: true });
            sharpStream.on("error", (err) =>
              console.error(`Sharp error on ${file.id}:`, err),
            );
            archive.append(driveRes.data.pipe(sharpStream), { name: fileName });
            debugLog += `-> SUCCESS: Streamed and compressed to JPEG.\n\n`;
          } else {
            archive.append(driveRes.data, { name: fileName });
            debugLog += `-> SUCCESS: Streamed original file.\n\n`;
          }

          appendedCount++;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          debugLog += `-> FATAL ERROR: ${err.message}\n\n`;
        }
      }

      if (appendedCount !== files.length) {
        archive.append(debugLog, { name: "error_log.txt" });
      }

      await archive.finalize();
    })();

    const folderName = body.folderName ?? "compressed_drive_files";

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${folderName}.zip"`,
        "X-Total-Bytes": totalSize.toString(),
        "Access-Control-Expose-Headers": "X-Total-Bytes",
      },
    });
  } catch (err) {
    console.error("[download/route] Fatal Error:", err);
    return NextResponse.json(
      { error: "Failed to create compressed archive." },
      { status: 500 },
    );
  }
}
