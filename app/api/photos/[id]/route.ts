import { db } from "@/lib/db";
import { fail, NotFound, ok, parseId } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { deletePhoto, photoData } from "@/lib/server";
import { removePhoto } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Serves photos kept in Postgres (no Blob store attached). Immutable, so cache hard. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const data = await photoData(await db(), parseId((await params).id));
    if (!data) throw new NotFound("No such photo");
    return new Response(new Uint8Array(data.bytes), {
      headers: { "content-type": data.mime, "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const photo = await deletePhoto(await db(), parseId((await params).id), requireMemberId(req));
    await removePhoto(photo.url);
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
