import { BlobFileTooLargeError, del, get, put } from "@vercel/blob";

export type BlobAccess = "public" | "private";
export interface StoredBlob {
  url: string;
  access: BlobAccess;
}

/**
 * Photos go to Vercel Blob when a store is attached (BLOB_READ_WRITE_TOKEN is
 * injected by Vercel → Storage → Blob). Stores are created either private or
 * public and the token doesn't say which, so try private first (party photos
 * shouldn't be world-readable) and fall back to public. Without a store at
 * all, `null` tells the caller to keep the bytes in Postgres instead.
 * Photos arrive already resized by the phone (~1600px JPEG).
 */
export async function storePhoto(photoId: string, drinkId: string, bytes: Uint8Array, mime: string): Promise<StoredBlob | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const path = `drinks/${drinkId}/${photoId}.${ext}`;
  let firstError: unknown;
  for (const access of ["private", "public"] as const) {
    try {
      const blob = await put(path, Buffer.from(bytes), { access, contentType: mime, addRandomSuffix: false, allowOverwrite: true });
      return { url: blob.url, access };
    } catch (err) {
      if (err instanceof BlobFileTooLargeError) throw err;
      firstError ??= err;
    }
  }
  throw firstError;
}

/** Stream a private blob back through our own route. */
export async function readPrivatePhoto(url: string) {
  const res = await get(url, { access: "private" });
  return res && res.statusCode === 200 ? { stream: res.stream, mime: res.blob.contentType } : null;
}

export async function removePhoto(blobUrl: string | null) {
  if (process.env.BLOB_READ_WRITE_TOKEN && blobUrl) {
    await del(blobUrl).catch((err) => console.error("[blob] delete failed", err));
  }
}

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;
