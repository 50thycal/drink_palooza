import { db } from "@/lib/db";
import { fail, ok, parseText, readJson } from "@/lib/http";
import { createMember, listMembers } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listMembers(await db()));
  } catch (err) {
    return fail(err);
  }
}

/** "I'm new here." No password: the phone remembers the id it gets back. */
export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const name = parseText(body.name, "Name", 30)!;
    const emoji = parseText(body.emoji, "Emoji", 16, false);
    return ok(await createMember(await db(), name, emoji), 201);
  } catch (err) {
    return fail(err);
  }
}
