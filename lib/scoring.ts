import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "./constants";
import type { Comment, DrinkResult, EventResults, HallOfFame, Podium, Reaction, Score, ScoreMap, Superlative } from "./types";

/**
 * Pure scoring. Nothing here touches the database, so the same functions back
 * the Wrapped reveal, the Hall of Fame, and the tests.
 */

const WEIGHT: Record<CategoryKey, number> = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.weight])) as Record<CategoryKey, number>;

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function stdev(xs: number[]): number | null {
  if (xs.length < 2) return null;
  const m = mean(xs)!;
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length);
}

/**
 * Taste counts double: (2·taste + appearance + creativity + presentation) / 5.
 * A category nobody scored is left out and the weights renormalise, so a
 * missing glass never drags a drink to zero.
 */
export function weightedOverall(cats: ScoreMap): number | null {
  let total = 0;
  let weight = 0;
  for (const key of CATEGORY_KEYS) {
    const v = cats[key];
    if (v == null) continue;
    total += v * WEIGHT[key];
    weight += WEIGHT[key];
  }
  return weight ? total / weight : null;
}

export interface DrinkInput {
  id: string;
  member_id: string;
  name: string;
  hero_url: string | null;
}

/** Every rater's scores as z-scores against their own average, so a harsh and a generous critic count the same. */
function normalisedScores(scores: Score[]): Map<Score, number> {
  const byRater = new Map<string, number[]>();
  for (const s of scores) byRater.set(s.member_id, [...(byRater.get(s.member_id) ?? []), s.score]);
  const stats = new Map<string, { m: number; sd: number }>();
  for (const [id, xs] of byRater) stats.set(id, { m: mean(xs)!, sd: stdev(xs) ?? 0 });
  const out = new Map<Score, number>();
  for (const s of scores) {
    const { m, sd } = stats.get(s.member_id)!;
    out.set(s, sd > 0 ? (s.score - m) / sd : 0);
  }
  return out;
}

export function drinkResults(drinks: DrinkInput[], scores: Score[], reactions: Reaction[]): DrinkResult[] {
  const z = normalisedScores(scores);
  return drinks.map((d) => {
    const mine = scores.filter((s) => s.drink_id === d.id);
    const categories: ScoreMap = {};
    const fairCats: ScoreMap = {};
    for (const key of CATEGORY_KEYS) {
      const xs = mine.filter((s) => s.category === key);
      const m = mean(xs.map((s) => s.score));
      if (m != null) {
        categories[key] = m;
        fairCats[key] = mean(xs.map((s) => z.get(s)!))!;
      }
    }
    const raters = [...new Set(mine.map((s) => s.member_id))];
    const personal = raters
      .map((r) => weightedOverall(Object.fromEntries(mine.filter((s) => s.member_id === r).map((s) => [s.category, s.score]))))
      .filter((x): x is number => x != null);
    return {
      drink_id: d.id,
      member_id: d.member_id,
      name: d.name,
      hero_url: d.hero_url,
      categories,
      overall: weightedOverall(categories),
      fair: weightedOverall(fairCats),
      raters: raters.length,
      spread: stdev(personal),
      reactions: reactions.filter((r) => r.drink_id === d.id && r.member_id !== d.member_id).length,
    };
  });
}

/** Overall ranking. Ties go to the better Taste, then to whoever more people rated. */
export function rankOverall(results: DrinkResult[]): DrinkResult[] {
  return results
    .filter((r) => r.overall != null)
    .sort(
      (a, b) =>
        b.overall! - a.overall! ||
        (b.categories.taste ?? 0) - (a.categories.taste ?? 0) ||
        b.raters - a.raters ||
        a.name.localeCompare(b.name),
    );
}

function podium(category: CategoryKey | "overall", ranked: DrinkResult[], value: (r: DrinkResult) => number): Podium {
  return {
    category,
    places: ranked.slice(0, 3).map((r) => ({ drink_id: r.drink_id, member_id: r.member_id, name: r.name, value: value(r) })),
  };
}

export function categoryPodium(results: DrinkResult[], key: CategoryKey): Podium {
  const ranked = results
    .filter((r) => r.categories[key] != null)
    .sort((a, b) => b.categories[key]! - a.categories[key]! || (b.overall ?? 0) - (a.overall ?? 0) || a.name.localeCompare(b.name));
  return podium(key, ranked, (r) => r.categories[key]!);
}

export function superlatives(results: DrinkResult[], scores: Score[], comments: Comment[], reactions: Reaction[]): Superlative[] {
  const out: Superlative[] = [];
  const given = new Map<string, number[]>();
  for (const s of scores) given.set(s.member_id, [...(given.get(s.member_id) ?? []), s.score]);
  const critics = [...given].filter(([, xs]) => xs.length >= 4).map(([id, xs]) => ({ id, m: mean(xs)! }));
  if (critics.length >= 2) {
    critics.sort((a, b) => a.m - b.m);
    const harsh = critics[0];
    const kind = critics[critics.length - 1];
    if (kind.m > harsh.m) {
      out.push({ key: "harshest", title: "Harshest Critic", member_id: harsh.id, detail: `Poured an average of ${harsh.m.toFixed(1)}` });
      out.push({ key: "generous", title: "Most Generous", member_id: kind.id, detail: `Poured an average of ${kind.m.toFixed(1)}` });
    }
  }
  const divisive = results.filter((r) => r.spread != null && r.spread > 0).sort((a, b) => b.spread! - a.spread!)[0];
  if (divisive) {
    out.push({ key: "divisive", title: "Most Divisive", member_id: divisive.member_id, detail: `${divisive.name || "Their drink"} split the room (±${divisive.spread!.toFixed(1)})` });
  }
  const fav = [...results].sort((a, b) => b.reactions - a.reactions)[0];
  if (fav && fav.reactions > 0) {
    out.push({ key: "crowd", title: "Crowd Favourite", member_id: fav.member_id, detail: `${fav.reactions} reaction${fav.reactions === 1 ? "" : "s"} from the room` });
  }
  const talk = countBy(comments.map((c) => c.member_id));
  if (talk) out.push({ key: "chatterbox", title: "Chatterbox", member_id: talk.id, detail: `${talk.n} comment${talk.n === 1 ? "" : "s"} on the napkins` });
  const hype = countBy(reactions.map((r) => r.member_id));
  if (hype && hype.n >= 3) out.push({ key: "hype", title: "Hype Machine", member_id: hype.id, detail: `Sent ${hype.n} reactions` });
  return out;
}

function countBy(ids: string[]): { id: string; n: number } | null {
  const m = new Map<string, number>();
  for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
  let best: { id: string; n: number } | null = null;
  for (const [id, n] of m) if (!best || n > best.n) best = { id, n };
  return best;
}

function topEmoji(reactions: Reaction[]): string | null {
  return countBy(reactions.map((r) => r.emoji))?.id ?? null;
}

export interface PassInput {
  from_id: string;
  to_id: string;
}

/** Awards for napkins passed across the table. */
export function passAwards(passes: PassInput[]): Superlative[] {
  const out: Superlative[] = [];
  const sender = countBy(passes.map((p) => p.from_id));
  if (sender && sender.n >= 2) out.push({ key: "postman", title: "The Postman", member_id: sender.id, detail: `Passed ${sender.n} napkins across the table` });
  const pairs = countBy(passes.map((p) => [p.from_id, p.to_id].sort().join("|")));
  if (pairs && pairs.n >= 3) {
    const [a, b] = pairs.id.split("|");
    out.push({ key: "penpals", title: "Secret Pen Pals", member_id: a, partner_id: b, detail: `${pairs.n} napkins passed between them` });
  }
  return out;
}

export function eventResults(drinks: DrinkInput[], scores: Score[], comments: Comment[], reactions: Reaction[], passes: PassInput[] = []): EventResults {
  const results = drinkResults(drinks, scores, reactions);
  const ranked = rankOverall(results);
  const fairRanked = results.filter((r) => r.fair != null).sort((a, b) => b.fair! - a.fair! || (b.overall ?? 0) - (a.overall ?? 0));
  return {
    drinks: results,
    podiums: CATEGORY_KEYS.map((k) => categoryPodium(results, k)),
    overall: podium("overall", ranked, (r) => r.overall!),
    fair_winner: fairRanked[0] ? { drink_id: fairRanked[0].drink_id, member_id: fairRanked[0].member_id } : null,
    superlatives: [...superlatives(results, scores, comments, reactions), ...passAwards(passes)],
    totals: {
      drinks: drinks.length,
      scores: scores.length,
      comments: comments.length,
      reactions: reactions.length,
      passes: passes.length,
      top_emoji: topEmoji(reactions),
    },
  };
}

export interface CompletedEvent {
  id: string;
  name: string;
  completed_at: string;
  results: EventResults;
  event_names?: Record<string, string>;
}

/** Records across every finished palooza. Best-evers need at least two raters so one generous pour can't set a record. */
export function hallOfFame(events: CompletedEvent[]): HallOfFame {
  const sorted = [...events].sort((a, b) => b.completed_at.localeCompare(a.completed_at));
  const champions: HallOfFame["champions"] = [];
  const tally = new Map<string, { wins: number; podiums: number }>();
  const bump = (id: string, k: "wins" | "podiums") => {
    const t = tally.get(id) ?? { wins: 0, podiums: 0 };
    t[k] += 1;
    tally.set(id, t);
  };
  type Row = { result: DrinkResult; event: CompletedEvent };
  const all: Row[] = [];
  for (const e of sorted) {
    const [first, ...rest] = e.results.overall.places;
    if (first) {
      champions.push({ event_id: e.id, event_name: e.name, date: e.completed_at, member_id: first.member_id, drink_id: first.drink_id, drink_name: first.name, overall: first.value });
      bump(first.member_id, "wins");
      bump(first.member_id, "podiums");
    }
    for (const p of rest) bump(p.member_id, "podiums");
    for (const r of e.results.drinks) all.push({ result: r, event: e });
  }
  const eligible = all.filter((x) => x.result.raters >= 2);
  const best_ever: HallOfFame["best_ever"] = [];
  for (const key of ["overall", ...CATEGORY_KEYS] as const) {
    const val = (x: Row) => (key === "overall" ? x.result.overall : x.result.categories[key]) ?? null;
    const top = eligible.filter((x) => val(x) != null).sort((a, b) => val(b)! - val(a)!)[0];
    if (top) best_ever.push({ category: key, drink_id: top.result.drink_id, member_id: top.result.member_id, drink_name: top.result.name, event_name: top.event.name, value: val(top)! });
  }
  const pb = new Map<string, Row>();
  for (const x of all) {
    if (x.result.overall == null) continue;
    const cur = pb.get(x.result.member_id);
    if (!cur || x.result.overall > cur.result.overall!) pb.set(x.result.member_id, x);
  }
  return {
    champions,
    titles: [...tally].map(([member_id, t]) => ({ member_id, ...t })).sort((a, b) => b.wins - a.wins || b.podiums - a.podiums),
    best_ever,
    personal_bests: [...pb.values()]
      .map((x) => ({ member_id: x.result.member_id, drink_id: x.result.drink_id, drink_name: x.result.name, overall: x.result.overall! }))
      .sort((a, b) => b.overall - a.overall),
  };
}

/** Fisher–Yates. Takes a random source so tests can pin it. */
export function shuffle<T>(xs: T[], random: () => number = Math.random): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
