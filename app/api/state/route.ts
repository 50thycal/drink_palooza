import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { memberIdFrom } from "@/lib/identity";
import { loadHomeState } from "@/lib/server";

export const dynamic = "force-dynamic";

/** The single source of truth every phone polls. */
export async function GET(req: Request) {
  try {
    return ok(await loadHomeState(await db(), memberIdFrom(req)));
  } catch (err) {
    return fail(err);
  }
}
