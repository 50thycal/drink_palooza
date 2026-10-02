"use client";

/**
 * Phone cameras produce 4–12 MB photos (HEIC on iPhone). Draw them onto a
 * canvas at ≤1600px and re-encode as JPEG: one format everywhere, a few
 * hundred KB each, and well under the upload limit. Safari applies EXIF
 * orientation when decoding into an <img>, so the result is the right way up.
 */
export async function resizePhoto(file: File, max = 1600, quality = 0.82): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Couldn't read that photo"));
      el.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that photo"))), "image/jpeg", quality),
    );
    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
