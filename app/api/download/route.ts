import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import archiver from "archiver";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { files } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json(
        { error: "Service account key missing" },
        { status: 500 },
      );
    }

    // 1. Authenticate with the Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({ version: "v3", auth });

    // 2. Setup Web Stream for the browser
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("data", (chunk) => writer.write(chunk));
    archive.on("end", () => writer.close());
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      writer.abort(err);
    });

    // 3. Process files asynchronously
    (async () => {
      let appendedCount = 0;
      let debugLog = "--- DOWNLOAD DIAGNOSTICS LOG ---\n\n";

      for (const file of files) {
        debugLog += `File: ${file.name} (${file.mimeType})\n`;

        if (file.mimeType.startsWith("application/vnd.google-apps.")) {
          debugLog += `-> SKIPPED: Google Workspace files (Docs/Sheets) cannot be downloaded raw.\n\n`;
          continue;
        }

        try {
          // Fetch file stream natively using the Google Drive SDK
          const driveRes = await drive.files.get(
            {
              fileId: file.id,
              alt: "media",
              supportsAllDrives: true,
              acknowledgeAbuse: true,
            },
            { responseType: "stream" }, // <--- This prevents memory crashes!
          );

          let fileName = file.name;

          // Process Images through Sharp Stream
          if (file.mimeType.startsWith("image/")) {
            fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";

            // Create a sharp transform stream
            const sharpStream = sharp().webp({ quality: 50, effort: 6 });
            sharpStream.on("error", (err) =>
              console.error(`Sharp error on ${file.id}:`, err),
            );

            // Pipe: Google Drive -> Sharp -> Zip Archive
            archive.append(driveRes.data.pipe(sharpStream), { name: fileName });
            debugLog += `-> SUCCESS: Streamed and compressed to WebP.\n\n`;
          } else {
            // Process Non-Images (PDFs, Videos, etc)
            // Pipe: Google Drive -> Zip Archive
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
