// import { NextRequest, NextResponse } from "next/server";
// import archiver from "archiver";
// import sharp from "sharp";
// import { PassThrough } from "stream";

// const API_KEY = process.env.GOOGLE_API_KEY;
// const DRIVE_BASE = "https://www.googleapis.com/drive/v3";

// export async function POST(req: NextRequest) {
//   try {
//     const { files } = await req.json();

//     if (!files || !Array.isArray(files) || files.length === 0) {
//       return NextResponse.json({ error: "No files provided" }, { status: 400 });
//     }

//     // PassThrough acts as a bridge between the Node stream (archiver) and Web Stream (Next.js)
//     const passThrough = new PassThrough();

//     // Level 9 sets maximum ZIP zlib compression
//     const archive = archiver("zip", {
//       zlib: { level: 9 },
//     });

//     archive.on("error", (err) => {
//       console.error("Archive error:", err);
//       passThrough.destroy(err);
//     });

//     // Pipe the archive output directly to our PassThrough stream
//     archive.pipe(passThrough);

//     // Process files asynchronously so we don't block the stream initialization
//     (async () => {
//       for (const file of files) {
//         try {
//           // Fetch raw file content from Google Drive
//           const url = new URL(`${DRIVE_BASE}/files/${file.id}`);
//           url.searchParams.set("key", API_KEY!);
//           url.searchParams.set("alt", "media"); // alt=media downloads the file content

//           const res = await fetch(url.toString());
//           if (!res.ok) continue;

//           const arrayBuffer = await res.arrayBuffer();
//           let buffer = Buffer.from(arrayBuffer);
//           let fileName = file.name;

//           // If the file is an image, compress it heavily
//           if (file.mimeType.startsWith("image/")) {
//             // @ts-expect-error random
//             buffer = await sharp(buffer)
//               // Converting to webp with high effort/lower quality achieves maximum compression
//               .webp({ quality: 50, effort: 6 })
//               .toBuffer();

//             // Swap out the old extension (e.g., .jpg, .png) for .webp
//             fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
//           }

//           // Append to zip
//           archive.append(buffer, { name: fileName });
//         } catch (err) {
//           console.error(`Error processing file ${file.id}:`, err);
//         }
//       }

//       // Finalize the archive once all files are appended
//       await archive.finalize();
//     })();

//     // Convert the Node.js PassThrough stream to a Web ReadableStream for Next.js response
//     const stream = new ReadableStream({
//       start(controller) {
//         passThrough.on("data", (chunk) => controller.enqueue(chunk));
//         passThrough.on("end", () => controller.close());
//         passThrough.on("error", (err) => controller.error(err));
//       },
//     });

//     return new NextResponse(stream, {
//       headers: {
//         "Content-Type": "application/zip",
//         "Content-Disposition": `attachment; filename="compressed_drive_files.zip"`,
//       },
//     });
//   } catch (err) {
//     console.error("[download/route] Error:", err);
//     return NextResponse.json(
//       { error: "Failed to create compressed archive." },
//       { status: 500 },
//     );
//   }
// }

// ---------------------------------

import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_KEY = process.env.GOOGLE_API_KEY;
const DRIVE_BASE = "https://www.googleapis.com/drive/v3";

export async function POST(req: NextRequest) {
  try {
    const { files } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

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

        // 1. Check if it's a Google Workspace file
        if (file.mimeType.startsWith("application/vnd.google-apps.")) {
          debugLog += `-> SKIPPED: Google Workspace files (Docs/Sheets/Slides) cannot be downloaded as raw files.\n\n`;
          continue;
        }

        try {
          const url = new URL(`${DRIVE_BASE}/files/${file.id}`);
          url.searchParams.set("key", API_KEY!);
          url.searchParams.set("alt", "media");
          url.searchParams.set("supportsAllDrives", "true");
          url.searchParams.set("acknowledgeAbuse", "true");

          const res = await fetch(url.toString());

          // 2. Check if Google Drive blocked the download
          if (!res.ok) {
            const errorText = await res.text();
            debugLog += `-> FAILED: Google API blocked the download (Status ${res.status})\n`;
            debugLog += `-> ERROR DETAILS: ${errorText}\n\n`;
            continue;
          }

          const arrayBuffer = await res.arrayBuffer();
          let buffer = Buffer.from(arrayBuffer);
          let fileName = file.name;

          // 3. Compress images
          if (file.mimeType.startsWith("image/")) {
            try {
              // @ts-expect-error random
              buffer = await sharp(buffer)
                .webp({ quality: 50, effort: 6 })
                .toBuffer();
              fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
              debugLog += `-> SUCCESS: Compressed to WebP.\n\n`;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (sharpErr: any) {
              debugLog += `-> WARNING: Compression failed (${sharpErr.message}). Zipping original image instead.\n\n`;
            }
          } else {
            debugLog += `-> SUCCESS: Downloaded original file.\n\n`;
          }

          archive.append(buffer, { name: fileName });
          appendedCount++;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          debugLog += `-> FATAL ERROR: ${err.message}\n\n`;
        }
      }

      // If there were ANY failures, or if the zip is completely empty, add the debug log to the Zip
      if (appendedCount !== files.length) {
        archive.append(debugLog, { name: "error_log.txt" });
      }

      await archive.finalize();
    })();

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="compressed_drive_files.zip"`,
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
