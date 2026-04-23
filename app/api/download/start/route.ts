/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import archiver from "archiver";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory job store — works fine on a single VPS process
export const jobStore = new Map<
  string,
  {
    status: "running" | "done" | "error";
    processed: number;
    total: number;
    tmpPath?: string;
    error?: string;
  }
>();

async function fetchAllFilesInFolder(drive: any, folderId: string) {
  const allFiles: { id: string; name: string; mimeType: string }[] = [];
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

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });

    let files: { id: string; name: string; mimeType: string }[];

    if (body.folderId) {
      files = await fetchAllFilesInFolder(drive, body.folderId);
      if (files.length === 0) {
        return NextResponse.json(
          { error: "No downloadable files found." },
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

    // Filter out Google Workspace files upfront so total count is accurate
    const downloadableFiles = files.filter(
      (f) => !f.mimeType.startsWith("application/vnd.google-apps."),
    );

    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tmpPath = path.join(os.tmpdir(), `${jobId}.zip`);
    const folderName = body.folderName ?? "compressed_drive_files";

    // Register job
    jobStore.set(jobId, {
      status: "running",
      processed: 0,
      total: downloadableFiles.length,
    });

    // Run zip job in background — don't await
    (async () => {
      try {
        const output = fs.createWriteStream(tmpPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        await new Promise<void>((resolve, reject) => {
          output.on("finish", resolve);
          output.on("error", reject);
          archive.on("error", reject);
          archive.pipe(output);

          (async () => {
            for (const file of downloadableFiles) {
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
                  const sharpStream = sharp().jpeg({
                    quality: 60,
                    mozjpeg: true,
                  });
                  sharpStream.on("error", (err) =>
                    console.error(`Sharp error:`, err),
                  );
                  archive.append(driveRes.data.pipe(sharpStream), {
                    name: fileName,
                  });
                } else {
                  archive.append(driveRes.data, { name: fileName });
                }

                // Update progress after each file
                const job = jobStore.get(jobId)!;
                jobStore.set(jobId, { ...job, processed: job.processed + 1 });
              } catch (err: any) {
                console.error(`Failed to process ${file.name}:`, err.message);
                // Still increment so progress doesn't stall
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
        });
      } catch (err: any) {
        console.error(`[job ${jobId}] failed:`, err.message);
        jobStore.set(jobId, {
          status: "error",
          processed: 0,
          total: downloadableFiles.length,
          error: err.message,
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
