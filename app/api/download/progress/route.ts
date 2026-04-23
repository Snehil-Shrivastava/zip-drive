import { NextRequest } from "next/server";
import { jobStore } from "../start/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");

  if (!jobId || !jobStore.has(jobId)) {
    return new Response("Job not found", { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      const interval = setInterval(() => {
        const job = jobStore.get(jobId);
        if (!job) {
          clearInterval(interval);
          controller.close();
          return;
        }

        send({
          processed: job.processed,
          total: job.total,
          status: job.status,
        });

        if (job.status === "done" || job.status === "error") {
          clearInterval(interval);
          controller.close();
        }
      }, 300);

      // Safety cleanup if client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
