import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { loadMemory } from "@/lib/server";

export const dynamic = "force-dynamic";

/** What the bar top has accumulated over every finished palooza. */
export async function GET() {
  try {
    return ok(await loadMemory(await db()));
  } catch (err) {
    return fail(err);
  }
}
