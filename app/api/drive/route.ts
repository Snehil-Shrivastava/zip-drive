import { NextRequest, NextResponse } from "next/server";
import { FOLDER_MIME } from "@/utils/drive";

const API_KEY = process.env.GOOGLE_API_KEY;
const DRIVE_BASE = "https://www.googleapis.com/drive/v3";

const FIELDS =
  "id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink,iconLink";

export async function GET(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Google Drive API key is not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  const pageToken = searchParams.get("pageToken") ?? undefined;

  if (!id) {
    return NextResponse.json(
      { error: "Missing drive resource id." },
      { status: 400 },
    );
  }

  try {
    // ── 1. Fetch the resource itself to know its name and type ───────────────
    const metaUrl = new URL(`${DRIVE_BASE}/files/${id}`);
    metaUrl.searchParams.set("key", API_KEY);
    metaUrl.searchParams.set("fields", FIELDS);
    metaUrl.searchParams.set("supportsAllDrives", "true");

    const metaRes = await fetch(metaUrl.toString());

    if (!metaRes.ok) {
      const err = await metaRes.json().catch(() => ({}));
      const message =
        err?.error?.message ?? "Could not access this Drive link.";

      // 403 usually means the file/folder isn't publicly shared
      if (metaRes.status === 403 || metaRes.status === 404) {
        return NextResponse.json(
          {
            error:
              "This Drive link is not publicly accessible. Make sure sharing is set to 'Anyone with the link'.",
          },
          { status: 403 },
        );
      }

      return NextResponse.json({ error: message }, { status: metaRes.status });
    }

    const meta = await metaRes.json();
    const isFolder = meta.mimeType === FOLDER_MIME;

    // ── 2. If it's a file, return just the single file metadata ─────────────
    if (!isFolder) {
      return NextResponse.json({
        folderName: null,
        isFile: true,
        files: [meta],
        nextPageToken: null,
      });
    }

    // ── 3. If it's a folder, list its children ───────────────────────────────
    const listUrl = new URL(`${DRIVE_BASE}/files`);
    listUrl.searchParams.set("key", API_KEY);
    listUrl.searchParams.set("q", `'${id}' in parents and trashed = false`);
    listUrl.searchParams.set("fields", `nextPageToken,files(${FIELDS})`);
    listUrl.searchParams.set("orderBy", "folder,name");
    listUrl.searchParams.set("pageSize", "100");
    listUrl.searchParams.set("supportsAllDrives", "true");
    listUrl.searchParams.set("includeItemsFromAllDrives", "true");
    if (pageToken) listUrl.searchParams.set("pageToken", pageToken);

    const listRes = await fetch(listUrl.toString());

    if (!listRes.ok) {
      const err = await listRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message ?? "Failed to list folder contents." },
        { status: listRes.status },
      );
    }

    const list = await listRes.json();

    return NextResponse.json({
      folderName: meta.name,
      isFile: false,
      files: list.files ?? [],
      nextPageToken: list.nextPageToken ?? null,
    });
  } catch (err) {
    console.error("[drive/route] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
