import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { loadCatalog } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await loadCatalog(await db()));
  } catch (err) {
    return fail(err);
  }
}
