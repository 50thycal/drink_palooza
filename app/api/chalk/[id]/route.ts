import { db } from "@/lib/db";
import { fail, ok, parseId } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { eraseChalk } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await eraseChalk(await db(), parseId((await params).id), requireMemberId(req));
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
