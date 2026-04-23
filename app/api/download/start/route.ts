// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { NextRequest, NextResponse } from "next/server";
// import { google } from "googleapis";
// import archiver from "archiver";
// import sharp from "sharp";
// import fs from "fs";
// import path from "path";
// import os from "os";

// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

// // In-memory job store — works fine on a single VPS process
// export const jobStore = new Map<
//   string,
//   {
//     status: "running" | "done" | "error";
//     processed: number;
//     total: number;
//     tmpPath?: string;
//     error?: string;
//   }
// >();

// async function fetchAllFilesInFolder(drive: any, folderId: string) {
//   const allFiles: { id: string; name: string; mimeType: string }[] = [];
//   let pageToken: string | undefined;

//   do {
//     const res = await drive.files.list({
//       q: `'${folderId}' in parents and trashed = false`,
//       fields: "nextPageToken, files(id, name, mimeType)",
//       pageSize: 1000,
//       supportsAllDrives: true,
//       includeItemsFromAllDrives: true,
//       ...(pageToken ? { pageToken } : {}),
//     });
//     for (const file of res.data.files ?? []) {
//       if (file.mimeType === "application/vnd.google-apps.folder") continue;
//       allFiles.push({
//         id: file.id!,
//         name: file.name!,
//         mimeType: file.mimeType!,
//       });
//     }
//     pageToken = res.data.nextPageToken ?? undefined;
//   } while (pageToken);

//   return allFiles;
// }

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();

//     if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
//       return NextResponse.json(
//         { error: "Service account key missing" },
//         { status: 500 },
//       );
//     }

//     const auth = new google.auth.GoogleAuth({
//       credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
//       scopes: ["https://www.googleapis.com/auth/drive.readonly"],
//     });
//     const drive = google.drive({ version: "v3", auth });

//     let files: { id: string; name: string; mimeType: string }[];

//     if (body.folderId) {
//       files = await fetchAllFilesInFolder(drive, body.folderId);
//       if (files.length === 0) {
//         return NextResponse.json(
//           { error: "No downloadable files found." },
//           { status: 400 },
//         );
//       }
//     } else if (Array.isArray(body.files) && body.files.length > 0) {
//       files = body.files;
//     } else {
//       return NextResponse.json(
//         { error: "No files or folderId provided." },
//         { status: 400 },
//       );
//     }

//     // Filter out Google Workspace files upfront so total count is accurate
//     const downloadableFiles = files.filter(
//       (f) => !f.mimeType.startsWith("application/vnd.google-apps."),
//     );

//     const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2)}`;
//     const tmpPath = path.join(os.tmpdir(), `${jobId}.zip`);
//     const folderName = body.folderName ?? "compressed_drive_files";

//     // Register job
//     jobStore.set(jobId, {
//       status: "running",
//       processed: 0,
//       total: downloadableFiles.length,
//     });

//     // Run zip job in background — don't await
//     (async () => {
//       try {
//         const output = fs.createWriteStream(tmpPath);
//         const archive = archiver("zip", { zlib: { level: 9 } });

//         await new Promise<void>((resolve, reject) => {
//           output.on("finish", resolve);
//           output.on("error", reject);
//           archive.on("error", reject);
//           archive.pipe(output);

//           (async () => {
//             for (const file of downloadableFiles) {
//               try {
//                 const driveRes = await drive.files.get(
//                   {
//                     fileId: file.id,
//                     alt: "media",
//                     supportsAllDrives: true,
//                     acknowledgeAbuse: true,
//                   },
//                   { responseType: "stream" },
//                 );

//                 let fileName = file.name;
//                 if (file.mimeType.startsWith("image/")) {
//                   fileName = fileName.replace(/\.[^/.]+$/, "") + ".jpg";
//                   const sharpStream = sharp().jpeg({
//                     quality: 60,
//                     mozjpeg: true,
//                   });
//                   sharpStream.on("error", (err) =>
//                     console.error(`Sharp error:`, err),
//                   );
//                   archive.append(driveRes.data.pipe(sharpStream), {
//                     name: fileName,
//                   });
//                 } else {
//                   archive.append(driveRes.data, { name: fileName });
//                 }

//                 // Update progress after each file
//                 const job = jobStore.get(jobId)!;
//                 jobStore.set(jobId, { ...job, processed: job.processed + 1 });
//               } catch (err: any) {
//                 console.error(`Failed to process ${file.name}:`, err.message);
//                 // Still increment so progress doesn't stall
//                 const job = jobStore.get(jobId)!;
//                 jobStore.set(jobId, { ...job, processed: job.processed + 1 });
//               }
//             }

//             await archive.finalize();
//           })().catch(reject);
//         });

//         jobStore.set(jobId, {
//           status: "done",
//           processed: downloadableFiles.length,
//           total: downloadableFiles.length,
//           tmpPath,
//         });
//       } catch (err: any) {
//         console.error(`[job ${jobId}] failed:`, err.message);
//         jobStore.set(jobId, {
//           status: "error",
//           processed: 0,
//           total: downloadableFiles.length,
//           error: err.message,
//         });
//         fs.unlink(tmpPath, () => {});
//       }
//     })();

//     return NextResponse.json({
//       jobId,
//       total: downloadableFiles.length,
//       folderName,
//     });
//   } catch (err) {
//     console.error("[download/start] Fatal:", err);
//     return NextResponse.json(
//       { error: "Failed to start job." },
//       { status: 500 },
//     );
//   }
// }

// ---------------- one drive and gdrive download

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import archiver from "archiver";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const jobStore = new Map<
  string,
  {
    status: "running" | "done" | "error";
    processed: number;
    total: number;
    tmpPath?: string;
    folderName?: string;
    error?: string;
  }
>();

// ── Google Drive: fetch all files in a folder ─────────────────────────────────
async function fetchAllGDriveFiles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drive: any,
  folderId: string,
): Promise<
  {
    id: string;
    name: string;
    mimeType: string;
    source: "gdrive";
    downloadUrl?: never;
  }[]
> {
  const allFiles: {
    id: string;
    name: string;
    mimeType: string;
    source: "gdrive";
  }[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      ...(pageToken ? { pageToken } : {}),
    });

    for (const file of res.data.files ?? []) {
      if (file.mimeType === "application/vnd.google-apps.folder") continue;
      allFiles.push({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        source: "gdrive",
      });
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return allFiles;
}

// ── OneDrive: fetch all files in a folder ────────────────────────────────────
async function fetchAllOneDriveFiles(
  shareToken: string,
  itemId?: string,
): Promise<
  {
    id: string;
    name: string;
    mimeType: string;
    source: "onedrive";
    downloadUrl: string;
  }[]
> {
  const allFiles: {
    id: string;
    name: string;
    mimeType: string;
    source: "onedrive";
    downloadUrl: string;
  }[] = [];
  const ONEDRIVE_BASE = "https://api.onedrive.com/v1.0";

  let url: string;

  if (itemId) {
    url = `${ONEDRIVE_BASE}/drive/items/${itemId}/children?$top=1000&$select=id,name,file,folder,@content.downloadUrl`;
  } else {
    url = `${ONEDRIVE_BASE}/shares/${shareToken}/root/children?$top=1000&$select=id,name,file,folder,@content.downloadUrl`;
  }

  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OneDrive listing failed: ${res.status}`);
    const data = await res.json();

    for (const item of data.value ?? []) {
      if (item.folder) continue; // skip subfolders for now
      if (!item["@content.downloadUrl"]) continue;
      allFiles.push({
        id: item.id,
        name: item.name,
        mimeType: item.file?.mimeType ?? "application/octet-stream",
        source: "onedrive",
        downloadUrl: item["@content.downloadUrl"],
      });
    }

    url = data["@odata.nextLink"] ?? null;
  }

  return allFiles;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Resolve file list ──────────────────────────────────────────────────────

    type GDriveFile = {
      id: string;
      name: string;
      mimeType: string;
      source: "gdrive";
      downloadUrl?: never;
    };
    type OneDriveFile = {
      id: string;
      name: string;
      mimeType: string;
      source: "onedrive";
      downloadUrl: string;
    };
    type AnyFile = GDriveFile | OneDriveFile;

    let files: AnyFile[];

    // ── OneDrive paths ────────────────────────────────────────────────────────
    if (body.source === "onedrive") {
      if (!body.shareToken) {
        return NextResponse.json(
          { error: "Missing shareToken for OneDrive." },
          { status: 400 },
        );
      }

      if (body.files && Array.isArray(body.files)) {
        // Selected files — already have downloadUrls from the client
        files = body.files as OneDriveFile[];
      } else if (body.folderId || body.shareToken) {
        // Download all — fetch from API
        files = await fetchAllOneDriveFiles(body.shareToken, body.folderId);
        if (files.length === 0) {
          return NextResponse.json(
            { error: "No downloadable files found." },
            { status: 400 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "No files or folderId provided." },
          { status: 400 },
        );
      }

      // ── Google Drive paths ────────────────────────────────────────────────────
    } else {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        return NextResponse.json(
          { error: "Service account key missing." },
          { status: 500 },
        );
      }

      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });
      const drive = google.drive({ version: "v3", auth });

      if (body.folderId) {
        files = await fetchAllGDriveFiles(drive, body.folderId);
        if (files.length === 0) {
          return NextResponse.json(
            { error: "No downloadable files found." },
            { status: 400 },
          );
        }
      } else if (Array.isArray(body.files) && body.files.length > 0) {
        files = body.files as GDriveFile[];
      } else {
        return NextResponse.json(
          { error: "No files or folderId provided." },
          { status: 400 },
        );
      }

      // Attach drive instance to use inside the job — we re-auth inside the job too
      // so we store credentials reference instead
    }

    // ── Filter out Google Workspace files ─────────────────────────────────────
    const downloadableFiles = files.filter(
      (f) => !f.mimeType.startsWith("application/vnd.google-apps."),
    );

    if (downloadableFiles.length === 0) {
      return NextResponse.json(
        { error: "No downloadable files found." },
        { status: 400 },
      );
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tmpPath = path.join(os.tmpdir(), `${jobId}.zip`);
    const folderName = body.folderName ?? "compressed_files";

    // Register job
    jobStore.set(jobId, {
      status: "running",
      processed: 0,
      total: downloadableFiles.length,
      folderName,
    });

    // ── Background zip job ────────────────────────────────────────────────────
    (async () => {
      // Re-authenticate Google Drive inside the async job if needed
      let drive: ReturnType<typeof google.drive> | null = null;
      if (
        body.source !== "onedrive" &&
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY
      ) {
        const auth = new google.auth.GoogleAuth({
          credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
          scopes: ["https://www.googleapis.com/auth/drive.readonly"],
        });
        drive = google.drive({ version: "v3", auth });
      }

      try {
        const output = fs.createWriteStream(tmpPath);
        const archive = archiver("zip", { zlib: { level: 6 } });

        await new Promise<void>((resolve, reject) => {
          output.on("finish", resolve);
          output.on("error", reject);
          archive.on("error", reject);
          archive.pipe(output);

          (async () => {
            for (const file of downloadableFiles) {
              try {
                let fileName = file.name;

                if (file.source === "onedrive") {
                  // ── OneDrive: fetch from pre-signed URL ───────────────────
                  const fileRes = await fetch(
                    (file as OneDriveFile).downloadUrl,
                  );
                  if (!fileRes.ok)
                    throw new Error(
                      `Failed to fetch ${file.name}: ${fileRes.status}`,
                    );

                  const buffer = Buffer.from(await fileRes.arrayBuffer());

                  if (file.mimeType.startsWith("image/")) {
                    fileName = fileName.replace(/\.[^/.]+$/, "") + ".jpg";
                    const compressed = await sharp(buffer)
                      .jpeg({ quality: 80, mozjpeg: true })
                      .toBuffer();
                    archive.append(compressed, { name: fileName });
                  } else {
                    archive.append(buffer, { name: fileName });
                  }
                } else {
                  // ── Google Drive: stream via SDK ──────────────────────────
                  if (!drive)
                    throw new Error("Google Drive client not initialized.");

                  const driveRes = await drive.files.get(
                    {
                      fileId: file.id,
                      alt: "media",
                      supportsAllDrives: true,
                      acknowledgeAbuse: true,
                    },
                    { responseType: "stream" },
                  );

                  if (file.mimeType.startsWith("image/")) {
                    fileName = fileName.replace(/\.[^/.]+$/, "") + ".jpg";
                    const sharpStream = sharp().jpeg({
                      quality: 80,
                      mozjpeg: true,
                    });
                    sharpStream.on("error", (err) =>
                      console.error(`Sharp error on ${file.id}:`, err),
                    );
                    archive.append(driveRes.data.pipe(sharpStream), {
                      name: fileName,
                    });
                  } else {
                    archive.append(driveRes.data, { name: fileName });
                  }
                }

                // Update progress
                const job = jobStore.get(jobId)!;
                jobStore.set(jobId, { ...job, processed: job.processed + 1 });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } catch (err: any) {
                console.error(
                  `[job ${jobId}] Failed to process ${file.name}:`,
                  err.message,
                );
                // Increment anyway so progress doesn't stall
                const job = jobStore.get(jobId)!;
                jobStore.set(jobId, { ...job, processed: job.processed + 1 });
              }
            }

            await archive.finalize();
          })().catch(reject);
        });

        jobStore.set(jobId, {
          status: "done",
          processed: downloadableFiles.length,
          total: downloadableFiles.length,
          tmpPath,
          folderName,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error(`[job ${jobId}] Fatal:`, err.message);
        jobStore.set(jobId, {
          status: "error",
          processed: 0,
          total: downloadableFiles.length,
          error: err.message,
          folderName,
        });
        fs.unlink(tmpPath, () => {});
      }
    })();

    return NextResponse.json({
      jobId,
      total: downloadableFiles.length,
      folderName,
    });
  } catch (err) {
    console.error("[download/start] Fatal:", err);
    return NextResponse.json(
      { error: "Failed to start job." },
      { status: 500 },
    );
  }
}
