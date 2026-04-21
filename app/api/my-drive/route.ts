import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const DRIVE_BASE = "https://www.googleapis.com/drive/v3";
const FIELDS =
  "id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink,iconLink";

type DriveTab = "my-drive" | "recent" | "starred" | "shared";

function buildQuery(tab: DriveTab, folderId?: string): string {
  // If a folderId is present we're always drilling into a folder —
  // regardless of which tab we came from, list that folder's children.
  if (folderId) {
    return `'${folderId}' in parents and trashed = false`;
  }

  // Root-level query per tab
  switch (tab) {
    case "my-drive":
      return `'root' in parents and trashed = false`;
    case "recent":
      // Recent = any non-trashed file, ordered by last viewed (set in buildOrderBy)
      return `trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
    case "starred":
      return `starred = true and trashed = false`;
    case "shared":
      return `sharedWithMe = true and trashed = false`;
    default:
      return `'root' in parents and trashed = false`;
  }
}

function buildOrderBy(tab: DriveTab, folderId?: string): string {
  // Inside a sub-folder always sort folders-first then by name
  if (folderId) return "folder,name";
  if (tab === "recent") return "viewedByMeTime desc";
  return "folder,name";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accessToken = (session as any).accessToken as string;
  if (!accessToken) {
    return NextResponse.json(
      { error: "No access token found. Please reconnect your Drive." },
      { status: 401 },
    );
  }

  const { searchParams } = req.nextUrl;
  const tab = (searchParams.get("tab") ?? "my-drive") as DriveTab;
  const folderId = searchParams.get("folderId") ?? undefined;
  const pageToken = searchParams.get("pageToken") ?? undefined;

  try {
    // Fetch folder metadata when drilling into a subfolder so the breadcrumb
    // label is always accurate (the client already knows its name from the
    // parent listing, but this keeps the API self-contained).
    let folderName: string | null = null;

    if (folderId) {
      const metaUrl = new URL(`${DRIVE_BASE}/files/${folderId}`);
      metaUrl.searchParams.set("fields", "id,name,mimeType");
      metaUrl.searchParams.set("supportsAllDrives", "true");
      const metaRes = await fetch(metaUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        folderName = meta.name ?? null;
      }
    }

    // List files / folder contents
    const listUrl = new URL(`${DRIVE_BASE}/files`);
    listUrl.searchParams.set("fields", `nextPageToken,files(${FIELDS})`);
    listUrl.searchParams.set("q", buildQuery(tab, folderId));
    listUrl.searchParams.set("orderBy", buildOrderBy(tab, folderId));
    listUrl.searchParams.set("pageSize", "50");
    listUrl.searchParams.set("supportsAllDrives", "true");
    listUrl.searchParams.set("includeItemsFromAllDrives", "true");
    if (pageToken) listUrl.searchParams.set("pageToken", pageToken);

    const listRes = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listRes.ok) {
      const err = await listRes.json().catch(() => ({}));
      if (listRes.status === 401) {
        return NextResponse.json(
          { error: "Session expired. Please reconnect your Drive." },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { error: err?.error?.message ?? "Failed to list Drive contents." },
        { status: listRes.status },
      );
    }

    const list = await listRes.json();

    return NextResponse.json({
      folderName,
      files: list.files ?? [],
      nextPageToken: list.nextPageToken ?? null,
    });
  } catch (err) {
    console.error("[my-drive/route] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
