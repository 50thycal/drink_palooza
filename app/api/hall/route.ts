import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { loadHallOfFame } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await loadHallOfFame(await db()));
  } catch (err) {
    return fail(err);
  }
}
