import { db } from "@/lib/db";
import { fail, ok, parseId, parseText, readJson } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { updateMember } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id);
    const body = await readJson(req);
    return ok(
      await updateMember(await db(), id, requireMemberId(req), {
        name: parseText(body.name, "Name", 30, false),
        emoji: parseText(body.emoji, "Emoji", 16, false),
      }),
    );
  } catch (err) {
    return fail(err);
  }
}
