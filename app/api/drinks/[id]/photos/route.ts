import { db } from "@/lib/db";
import { BadRequest, fail, ok, parseId } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { addPhoto } from "@/lib/server";
import { PHOTO_MAX_BYTES, PHOTO_TYPES, storePhoto } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Multipart: `photo` (already resized on the phone), optional `width`/`height`. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id);
    const me = requireMemberId(req);
    const form = await req.formData().catch(() => null);
    const file = form?.get("photo");
    if (!(file instanceof Blob)) throw new BadRequest("Attach a photo");
    if (!PHOTO_TYPES.includes(file.type)) throw new BadRequest("Photos must be JPEG, PNG or WebP");
    if (file.size > PHOTO_MAX_BYTES) throw new BadRequest("That photo is too big");
    const dim = (k: string) => {
      const n = Number(form?.get(k));
      return Number.isInteger(n) && n > 0 ? n : null;
    };
    const photo = await addPhoto(
      await db(),
      id,
      me,
      { bytes: new Uint8Array(await file.arrayBuffer()), mime: file.type, width: dim("width"), height: dim("height") },
      storePhoto,
    );
    return ok(photo, 201);
  } catch (err) {
    return fail(err);
  }
}
