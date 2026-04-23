// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { NextRequest, NextResponse } from "next/server";

// const ONEDRIVE_BASE = "https://api.onedrive.com/v1.0";

// function encodeSharingUrl(url: string): string {
//   const base64 = Buffer.from(url).toString("base64");
//   return (
//     "u!" + base64.replace(/=/g, "").replace(/\//g, "_").replace(/\+/g, "-")
//   );
// }

// async function resolveShortLink(url: string): Promise<string> {
//   const res = await fetch(url, { method: "HEAD", redirect: "follow" });
//   return res.url;
// }

// export async function POST(req: NextRequest) {
//   const { link, itemId, shareToken, pageToken } = await req.json();

//   if (!link && !itemId) {
//     return NextResponse.json({ error: "Missing link or id." }, { status: 400 });
//   }

//   try {
//     let encodedToken: string;

//     if (itemId && shareToken) {
//       encodedToken = shareToken;
//     } else {
//       let resolvedUrl = link!;
//       if (
//         resolvedUrl.includes("1drv.ms") ||
//         resolvedUrl.includes("onedrive.live.com/redir")
//       ) {
//         resolvedUrl = await resolveShortLink(resolvedUrl);
//       }
//       encodedToken = encodeSharingUrl(resolvedUrl);
//     }

//     let apiUrl: string;

//     if (pageToken) {
//       // pageToken is the full nextLink URL from previous response
//       apiUrl = pageToken;
//     } else if (itemId) {
//       apiUrl = `${ONEDRIVE_BASE}/drive/items/${itemId}/children?$top=100&$select=id,name,file,folder,size,lastModifiedDateTime,@content.downloadUrl`;
//     } else {
//       apiUrl = `${ONEDRIVE_BASE}/shares/${encodedToken}/root?$expand=children($select=id,name,file,folder,size,lastModifiedDateTime,@content.downloadUrl)`;
//     }

//     const res = await fetch(apiUrl);

//     if (!res.ok) {
//       const err = await res.json().catch(() => ({}));
//       if (res.status === 403 || res.status === 404) {
//         return NextResponse.json(
//           {
//             error:
//               "This OneDrive link is not publicly accessible. Make sure sharing is set to 'Anyone with the link'.",
//           },
//           { status: 403 },
//         );
//       }
//       return NextResponse.json(
//         {
//           error: err?.error?.message ?? "Could not access this OneDrive link.",
//         },
//         { status: res.status },
//       );
//     }

//     const data = await res.json();

//     if (!itemId && !pageToken) {
//       // First load — root item with children expanded
//       const isFile = !!data.file;

//       if (isFile) {
//         return NextResponse.json({
//           folderName: null,
//           isFile: true,
//           shareToken: encodedToken,
//           files: [
//             {
//               id: data.id,
//               name: data.name,
//               mimeType: data.file?.mimeType ?? "application/octet-stream",
//               size: data.size?.toString() ?? "0",
//               modifiedTime: data.lastModifiedDateTime,
//               downloadUrl: data["@content.downloadUrl"],
//               isFolder: false,
//             },
//           ],
//           nextPageToken: null,
//         });
//       }

//       const children = data.children ?? [];
//       const files = children.map((item: any) => ({
//         id: item.id,
//         name: item.name,
//         mimeType:
//           item.file?.mimeType ??
//           (item.folder
//             ? "application/vnd.onedrive.folder"
//             : "application/octet-stream"),
//         size: item.size?.toString() ?? "0",
//         modifiedTime: item.lastModifiedDateTime,
//         downloadUrl: item["@content.downloadUrl"] ?? null,
//         isFolder: !!item.folder,
//       }));

//       return NextResponse.json({
//         folderName: data.name,
//         isFile: false,
//         shareToken: encodedToken,
//         files,
//         nextPageToken: data.children?.["@odata.nextLink"] ?? null,
//       });
//     }

//     // Subfolder or paginated response
//     const files = (data.value ?? []).map((item: any) => ({
//       id: item.id,
//       name: item.name,
//       mimeType:
//         item.file?.mimeType ??
//         (item.folder
//           ? "application/vnd.onedrive.folder"
//           : "application/octet-stream"),
//       size: item.size?.toString() ?? "0",
//       modifiedTime: item.lastModifiedDateTime,
//       downloadUrl: item["@content.downloadUrl"] ?? null,
//       isFolder: !!item.folder,
//     }));

//     return NextResponse.json({
//       folderName: null,
//       isFile: false,
//       shareToken: encodedToken,
//       files,
//       nextPageToken: data["@odata.nextLink"] ?? null,
//     });
//   } catch (err) {
//     console.error("[onedrive/route] Unexpected error:", err);
//     return NextResponse.json(
//       { error: "An unexpected error occurred. Please try again." },
//       { status: 500 },
//     );
//   }
// }

// -------------- fix

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

const ONEDRIVE_BASE = "https://api.onedrive.com/v1.0";

function encodeSharingUrl(url: string): string {
  const base64 = Buffer.from(url).toString("base64");
  return (
    "u!" + base64.replace(/=/g, "").replace(/\//g, "_").replace(/\+/g, "-")
  );
}

async function resolveShortLink(url: string): Promise<string> {
  const res = await fetch(url, { method: "HEAD", redirect: "follow" });
  return res.url;
}

function extractShareToken(url: string): string {
  try {
    const parsed = new URL(url);

    // Already a short 1drv.ms link — encode directly
    if (parsed.hostname === "1drv.ms") {
      return encodeSharingUrl(url);
    }

    // Long onedrive.live.com URL — try to extract resid or id+cid
    if (
      parsed.hostname === "onedrive.live.com" ||
      parsed.hostname.endsWith(".onedrive.live.com")
    ) {
      const resid = parsed.searchParams.get("resid");
      const id = parsed.searchParams.get("id");
      const cid = parsed.searchParams.get("cid");
      const authkey = parsed.searchParams.get("authkey");

      if (resid) {
        // resid is "CID!ITEMID" — reconstruct a minimal canonical URL and encode it
        const canonical = `https://onedrive.live.com/?resid=${encodeURIComponent(resid)}${authkey ? `&authkey=${encodeURIComponent(authkey)}` : ""}`;
        return encodeSharingUrl(canonical);
      }

      if (id && cid) {
        const canonical = `https://onedrive.live.com/?id=${id}&cid=${cid}${authkey ? `&authkey=${encodeURIComponent(authkey)}` : ""}`;
        return encodeSharingUrl(canonical);
      }
    }

    // Fallback — encode whatever we have
    return encodeSharingUrl(url);
  } catch {
    return encodeSharingUrl(url);
  }
}

export async function POST(req: NextRequest) {
  const { link, itemId, shareToken, pageToken } = await req.json();

  if (!link && !itemId && !pageToken) {
    return NextResponse.json({ error: "Missing link or id." }, { status: 400 });
  }

  try {
    let encodedToken: string;

    if (itemId && shareToken) {
      // Subfolder navigation — reuse the original share token
      encodedToken = shareToken;
    } else if (pageToken && shareToken) {
      // Pagination — reuse token, use pageToken as the API URL
      encodedToken = shareToken;
    } else {
      let resolvedUrl = link!;

      // Resolve short 1drv.ms links to their full URL first
      if (resolvedUrl.includes("1drv.ms")) {
        try {
          resolvedUrl = await resolveShortLink(resolvedUrl);
        } catch {
          // keep original if resolution fails
        }
      }

      encodedToken = extractShareToken(resolvedUrl);
    }

    // Build the API URL
    let apiUrl: string;

    if (pageToken) {
      apiUrl = pageToken;
    } else if (itemId) {
      apiUrl = `${ONEDRIVE_BASE}/drive/items/${itemId}/children?$top=100&$select=id,name,file,folder,size,lastModifiedDateTime,@content.downloadUrl`;
    } else {
      apiUrl = `${ONEDRIVE_BASE}/shares/${encodedToken}/root?$expand=children($select=id,name,file,folder,size,lastModifiedDateTime,@content.downloadUrl)`;
    }

    const res = await fetch(apiUrl);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 403 || res.status === 404) {
        return NextResponse.json(
          {
            error:
              "This OneDrive link is not publicly accessible. Make sure sharing is set to 'Anyone with the link'.",
          },
          { status: 403 },
        );
      }
      return NextResponse.json(
        {
          error: err?.error?.message ?? "Could not access this OneDrive link.",
        },
        { status: res.status },
      );
    }

    const data = await res.json();

    if (!itemId && !pageToken) {
      // First load — root item with children expanded
      const isFile = !!data.file;

      if (isFile) {
        return NextResponse.json({
          folderName: null,
          isFile: true,
          shareToken: encodedToken,
          files: [
            {
              id: data.id,
              name: data.name,
              mimeType: data.file?.mimeType ?? "application/octet-stream",
              size: data.size?.toString() ?? "0",
              modifiedTime: data.lastModifiedDateTime,
              downloadUrl: data["@content.downloadUrl"],
              isFolder: false,
            },
          ],
          nextPageToken: null,
        });
      }

      const children = data.children ?? [];
      const files = children.map((item: any) => ({
        id: item.id,
        name: item.name,
        mimeType:
          item.file?.mimeType ??
          (item.folder
            ? "application/vnd.onedrive.folder"
            : "application/octet-stream"),
        size: item.size?.toString() ?? "0",
        modifiedTime: item.lastModifiedDateTime,
        downloadUrl: item["@content.downloadUrl"] ?? null,
        isFolder: !!item.folder,
      }));

      return NextResponse.json({
        folderName: data.name,
        isFile: false,
        shareToken: encodedToken,
        files,
        nextPageToken: data.children?.["@odata.nextLink"] ?? null,
      });
    }

    // Subfolder or paginated response
    const files = (data.value ?? []).map((item: any) => ({
      id: item.id,
      name: item.name,
      mimeType:
        item.file?.mimeType ??
        (item.folder
          ? "application/vnd.onedrive.folder"
          : "application/octet-stream"),
      size: item.size?.toString() ?? "0",
      modifiedTime: item.lastModifiedDateTime,
      downloadUrl: item["@content.downloadUrl"] ?? null,
      isFolder: !!item.folder,
    }));

    return NextResponse.json({
      folderName: null,
      isFile: false,
      shareToken: encodedToken,
      files,
      nextPageToken: data["@odata.nextLink"] ?? null,
    });
  } catch (err) {
    console.error("[onedrive/route] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
