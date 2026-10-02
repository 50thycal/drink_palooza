import { db } from "@/lib/db";
import { BadRequest, fail, ok, parseId } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { advance, cancelEvent, finishEvent, joinEvent, leaveEvent, setSlide, shuffleOrder, startEvent, startReveal, takeHost } from "@/lib/server";

export const dynamic = "force-dynamic";

/**
 * Every lifecycle move is a POST to /api/events/:id/:action. The rules
 * (who may, and when) live in lib/server.ts, not here.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  try {
    const p = await params;
    const id = parseId(p.id);
    const me = requireMemberId(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const sql = await db();
    switch (p.action) {
      case "join":
        await joinEvent(sql, id, me);
        break;
      case "leave":
        await leaveEvent(sql, id, me);
        break;
      case "shuffle":
        await shuffleOrder(sql, id, me);
        break;
      case "start":
        await startEvent(sql, id, me);
        break;
      case "advance":
        await advance(sql, id, me, typeof body.drink_id === "string" ? body.drink_id : null);
        break;
      case "reveal":
        await startReveal(sql, id, me);
        break;
      case "slide":
        await setSlide(sql, id, me, Number(body.slide));
        break;
      case "finish":
        await finishEvent(sql, id, me);
        break;
      case "host":
        await takeHost(sql, id, me);
        break;
      case "cancel":
        await cancelEvent(sql, id, me);
        break;
      default:
        throw new BadRequest("Unknown action", 404);
    }
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
