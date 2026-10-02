import { del, put } from "@vercel/blob";

/**
 * Photos go to Vercel Blob when a store is attached (BLOB_READ_WRITE_TOKEN is
 * injected by Vercel → Storage → Blob). Without one, `null` tells the caller
 * to keep the bytes in Postgres instead, so local dev and a fresh deploy
 * still work. Photos arrive already resized by the phone (~1600px JPEG).
 */
export async function storePhoto(photoId: string, drinkId: string, bytes: Uint8Array, mime: string): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const blob = await put(`drinks/${drinkId}/${photoId}.${ext}`, Buffer.from(bytes), {
    access: "public",
    contentType: mime,
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function removePhoto(url: string) {
  if (process.env.BLOB_READ_WRITE_TOKEN && /^https:\/\//.test(url)) {
    await del(url).catch((err) => console.error("[blob] delete failed", err));
  }
}

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;
