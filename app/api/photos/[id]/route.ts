import { db } from "@/lib/db";
import { fail, NotFound, ok, parseId } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { deletePhoto, photoSource } from "@/lib/server";
import { readPrivatePhoto, removePhoto } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Serves photos that aren't on a public CDN: private Blob objects (streamed
 * with the store token) and Postgres fallbacks. Photos never change, so the
 * browser may cache them for good.
 */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const src = await photoSource(await db(), parseId((await params).id));
    const headers = { "cache-control": "private, max-age=31536000, immutable" };
    if (src?.kind === "bytes") return new Response(new Uint8Array(src.bytes), { headers: { ...headers, "content-type": src.mime } });
    if (src?.kind === "blob") {
      if (src.access === "public") return Response.redirect(src.url, 308);
      const blob = await readPrivatePhoto(src.url);
      if (blob) return new Response(blob.stream, { headers: { ...headers, "content-type": blob.mime } });
    }
    throw new NotFound("No such photo");
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const photo = await deletePhoto(await db(), parseId((await params).id), requireMemberId(req));
    await removePhoto(photo.blob_url);
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
