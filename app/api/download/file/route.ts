/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "../start/route";
import fs from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  const folderName = req.nextUrl.searchParams.get("folderName") ?? "download";

  const job = jobStore.get(jobId ?? "");

  if (!job || job.status !== "done" || !job.tmpPath) {
    return NextResponse.json(
      { error: "File not ready or not found." },
      { status: 404 },
    );
  }

  const stat = fs.statSync(job.tmpPath);
  const fileStream = fs.createReadStream(job.tmpPath);

  // Clean up after 5 minutes
  setTimeout(
    () => {
      fs.unlink(job.tmpPath!, () => {});
      jobStore.delete(jobId!);
    },
    5 * 60 * 1000,
  );

  return new NextResponse(fileStream as any, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${folderName}.zip"`,
      "Content-Length": stat.size.toString(),
    },
  });
}
