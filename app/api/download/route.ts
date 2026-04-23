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

async function fetchAllFilesInFolder(drive: any, folderId: string) {
  const allFiles: { id: string; name: string; mimeType: string }[] = [];
  let pageToken: string | undefined = undefined;

  do {
    // @ts-expect-error random
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
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
  let tmpPath: string | null = null;

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

    // 2. Resolve file list
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

    // 3. Write zip to a temp file on disk
    tmpPath = path.join(
      os.tmpdir(),
      `zipdrive-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`,
    );
    const output = fs.createWriteStream(tmpPath);
    const archive = archiver("zip", { zlib: { level: 9 } }); // level 6 = good balance of speed vs size

    // Wait for both archiver and the write stream to fully finish
    await new Promise<void>((resolve, reject) => {
      output.on("finish", resolve);
      output.on("error", reject);
      archive.on("error", reject);

      archive.pipe(output);

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
              const sharpStream = sharp().jpeg({ quality: 60, mozjpeg: true });
              sharpStream.on("error", (err) =>
                console.error(`Sharp error on ${file.id}:`, err),
              );
              archive.append(driveRes.data.pipe(sharpStream), {
                name: fileName,
              });
              debugLog += `-> SUCCESS: Compressed to JPEG.\n\n`;
            } else {
              archive.append(driveRes.data, { name: fileName });
              debugLog += `-> SUCCESS: Streamed original file.\n\n`;
            }

            appendedCount++;
          } catch (err: any) {
            debugLog += `-> FATAL ERROR: ${err.message}\n\n`;
          }
        }

        if (appendedCount !== files.length) {
          archive.append(debugLog, { name: "error_log.txt" });
        }

        await archive.finalize();
      })().catch(reject);
    });

    // 4. Now we know the exact zip size — read it and stream to client
    const stat = fs.statSync(tmpPath);
    const zipSize = stat.size;
    const folderName = body.folderName ?? "compressed_drive_files";

    const fileStream = fs.createReadStream(tmpPath);

    // 5. Clean up the temp file after 5 minutes (well after any download completes)
    setTimeout(
      () => {
        fs.unlink(tmpPath!, (err) => {
          if (err) console.error(`[cleanup] Failed to delete ${tmpPath}:`, err);
        });
      },
      5 * 60 * 1000,
    );

    return new NextResponse(fileStream as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${folderName}.zip"`,
        "Content-Length": zipSize.toString(), // ← this is what makes the progress bar work
      },
    });
  } catch (err) {
    // Clean up temp file immediately if something went wrong before we served it
    if (tmpPath) {
      fs.unlink(tmpPath, () => {});
    }
    console.error("[download/route] Fatal Error:", err);
    return NextResponse.json(
      { error: "Failed to create compressed archive." },
      { status: 500 },
    );
  }
}
