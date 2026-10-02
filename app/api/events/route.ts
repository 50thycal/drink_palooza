import { db } from "@/lib/db";
import { fail, ok, parseText, readJson } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { createEvent } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const me = requireMemberId(req);
    const body = await readJson(req);
    return ok(await createEvent(await db(), me, parseText(body.name, "Name", 60)!), 201);
  } catch (err) {
    return fail(err);
  }
}
