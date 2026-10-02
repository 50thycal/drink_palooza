import { db } from "@/lib/db";
import { fail, ok, parseId, parseText, readJson } from "@/lib/http";
import { memberIdFrom, requireMemberId } from "@/lib/identity";
import { loadDrinkDetail, parseIngredients, updateDrink } from "@/lib/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  try {
    return ok(await loadDrinkDetail(await db(), parseId((await params).id), memberIdFrom(req)));
  } catch (err) {
    return fail(err);
  }
}

/** The bartender edits their own drink: name, story, recipe. Empty strings clear a field. */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const id = parseId((await params).id);
    const body = await readJson(req);
    const text = (key: string, max: number) => (key in body ? (parseText(body[key], key, max, false) ?? "") : null);
    return ok(
      await updateDrink(await db(), id, requireMemberId(req), {
        name: text("name", 60),
        story: text("story", 600),
        glass: text("glass", 40),
        garnish: text("garnish", 80),
        method: text("method", 1500),
        ingredients: "ingredients" in body ? parseIngredients(body.ingredients) : null,
      }),
    );
  } catch (err) {
    return fail(err);
  }
}
