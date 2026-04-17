import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import sharp from "sharp";
import { PassThrough } from "stream";

const API_KEY = process.env.GOOGLE_API_KEY;
const DRIVE_BASE = "https://www.googleapis.com/drive/v3";

export async function POST(req: NextRequest) {
  try {
    const { files } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // PassThrough acts as a bridge between the Node stream (archiver) and Web Stream (Next.js)
    const passThrough = new PassThrough();

    // Level 9 sets maximum ZIP zlib compression
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      passThrough.destroy(err);
    });

    // Pipe the archive output directly to our PassThrough stream
    archive.pipe(passThrough);

    // Process files asynchronously so we don't block the stream initialization
    (async () => {
      for (const file of files) {
        try {
          // Fetch raw file content from Google Drive
          const url = new URL(`${DRIVE_BASE}/files/${file.id}`);
          url.searchParams.set("key", API_KEY!);
          url.searchParams.set("alt", "media"); // alt=media downloads the file content

          const res = await fetch(url.toString());
          if (!res.ok) continue;

          const arrayBuffer = await res.arrayBuffer();
          let buffer = Buffer.from(arrayBuffer);
          let fileName = file.name;

          // If the file is an image, compress it heavily
          if (file.mimeType.startsWith("image/")) {
            // @ts-expect-error ranfom
            buffer = await sharp(buffer)
              // Converting to webp with high effort/lower quality achieves maximum compression
              .webp({ quality: 50, effort: 6 })
              .toBuffer();

            // Swap out the old extension (e.g., .jpg, .png) for .webp
            fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
          }

          // Append to zip
          archive.append(buffer, { name: fileName });
        } catch (err) {
          console.error(`Error processing file ${file.id}:`, err);
        }
      }

      // Finalize the archive once all files are appended
      await archive.finalize();
    })();

    // Convert the Node.js PassThrough stream to a Web ReadableStream for Next.js response
    const stream = new ReadableStream({
      start(controller) {
        passThrough.on("data", (chunk) => controller.enqueue(chunk));
        passThrough.on("end", () => controller.close());
        passThrough.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="compressed_drive_files.zip"`,
      },
    });
  } catch (err) {
    console.error("[download/route] Error:", err);
    return NextResponse.json(
      { error: "Failed to create compressed archive." },
      { status: 500 },
    );
  }
}
