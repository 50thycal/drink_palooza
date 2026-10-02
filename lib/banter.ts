/**
 * What Mabel and Jasper say. Pure functions over the live state so the lines
 * can be tested and so every phone hears the same kind of thing at the same
 * moment (the exact line is picked at random per phone; that's half the fun).
 *
 * An Exchange is one beat of conversation: a single line, or a line and a
 * comeback from the other bartender.
 */
import type { CategoryKey } from "./constants";
import type { LiveEvent } from "./types";

export type Speaker = "mabel" | "jasper";
export interface Line {
  who: Speaker;
  text: string;
}
export type Exchange = Line[];

export interface BanterCtx {
  me: { id: string; name: string } | null;
  live: LiveEvent | null;
  joined: boolean;
  nameOf: (id: string | null | undefined) => string | null;
  /** Titles won, by member id (from the bar's memory). */
  wins: Record<string, number>;
}

type Rng = () => number;
export const pick = <T>(xs: readonly T[], rng: Rng = Math.random): T => xs[Math.floor(rng() * xs.length) % xs.length];
const M = (text: string): Line => ({ who: "mabel", text });
const J = (text: string): Line => ({ who: "jasper", text });

function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** "Sam", "Sam and Zoe", "Sam, Zoe and Cal". */
export function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// ---- The bartender scene ---------------------------------------------------

/** The one thing you most need to hear right now. */
function statusLine(ctx: BanterCtx, rng: Rng): Exchange {
  const { me, live, joined, nameOf, wins } = ctx;
  const s: Speaker = rng() < 0.5 ? "mabel" : "jasper";
  const say = (m: string, j: string): Exchange => [s === "mabel" ? M(m) : J(j)];
  if (!me) return say("Evening, darling! Who's drinking tonight?", "Evening. Whose tab am I starting?");
  const titles = wins[me.id] ?? 0;
  if ((!live || live.event.status === "lobby") && titles >= 3)
    return say(`Well, if it isn't the legend! ${titles} titles, ${me.name}. The usual?`, `${me.name}. ${titles}-time champion. Your stool's been kept warm.`);
  if (!live && titles > 0) return say(`Our champ! Throw another palooza and defend that crown, ${me.name}?`, `Evening, champion. The others want a rematch, ${me.name}.`);
  if (!live) return say(`Quiet night, ${me.name}. Shall we throw a palooza?`, `Slow one tonight, ${me.name}. Fancy opening a palooza?`);
  const presenter = nameOf(live.current?.member_id);
  switch (live.event.status) {
    case "lobby": {
      if (!joined) return say(`Pull up a stool, ${me.name}! ${live.event.name} is filling up.`, `There's a seat for you at ${live.event.name}, ${me.name}.`);
      if (titles > 0) return say(`Our champ's back! Defending the crown tonight, ${me.name}?`, `The reigning champion returns. Don't get comfortable, ${me.name}.`);
      const mine = live.drinks.find((d) => d.member_id === me.id);
      if (mine && !mine.has_recipe) return say(`Your recipe card's blank, ${me.name}. Even a napkin sketch will do, sugar.`, `No recipe yet, ${me.name}. I can't pour a mystery.`);
      if (mine && !mine.hero_url) return say(`Snap a photo of that drink, ${me.name}. Pics or it didn't happen.`, `Recipe's in. Now a photo, ${me.name}. Good side, please.`);
      return say("Get your recipe written up, sugar. The show starts soon!", "You're all set. Now we wait for the stragglers.");
    }
    case "live":
      if (live.current?.member_id === me.id) return say(`You're on, ${me.name}! Knock 'em dead.`, `Your turn, ${me.name}. The stage is yours.`);
      return say(
        presenter ? `${presenter} is up${live.current?.name ? ` with the ${live.current.name}` : ""}. Grab a glass, darling!` : "The show's on!",
        presenter ? `${presenter} has the floor. Go pour your verdict.` : "The show's on.",
      );
    case "lastcall":
      return say(`Last call! Get those pours in, ${me.name}.`, `Last call, ${me.name}. Finish your pours.`);
    case "wrapped":
      return say("The verdict is in! Eyes on the wall!", "The envelopes are open. To the wall!");
    default:
      return say("Cheers, darling!", "Cheers.");
  }
}

/** Running jokes about the evening itself. {name} gets someone at the bar. */
const PARTY: ((name: string, me: string) => Exchange)[] = [
  () => [M("Pace yourselves, darlings. It's a tasting, not a tumble."), J("Says the woman who tasted everything twice.")],
  () => [J("House rule: if you can't pronounce your cocktail, you've had enough.")],
  () => [M("Water between rounds, sugar. Doctor's orders."), J("We don't have a doctor."), M("Then bartender's orders.")],
  () => [J("I counted the bottles. I'll count them again at the end. For science.")],
  () => [M("Tonight's forecast: a hundred percent chance of somebody crying at the reveal.")],
  (n) => [J(`${n} looks like trouble tonight.`), M(`${n} always looks like trouble. That's why we love 'em.`)],
  () => [M("Remember, it's not a competition."), J("It's absolutely a competition.")],
  () => [J("Somebody's putting pickle juice in something. I can feel it.")],
  (n) => [M(`Last time ${n} said "just a sip", we lost a lampshade.`)],
  () => [J("Ice is chilled, glasses are frosted, livers are… optimistic.")],
  () => [J("Designated driver, raise your hand."), M("…Anyone?"), J("Rideshares it is.")],
  (_n, me) => [J(`Tip jar's right there, ${me}. Just saying.`)],
  () => [M("I'll be judging silently tonight."), J("She will not.")],
  (n) => [M(`${n}, darling, that's your second 'tasting'. I'm counting.`)],
  () => [J("We're going to be drinking too much tonight."), M("You say that like it's a warning.")],
  () => [M("Somebody hide the good gin from Jasper."), J("Already hid it. From myself. Can't find it now.")],
  (n) => [J(`If ${n} starts a toast, somebody time it. Last one ran eleven minutes.`)],
  () => [M("The secret ingredient is always love."), J("And a frankly irresponsible amount of rum.")],
  () => [J("Shaken, stirred, or thrown together in a panic. We judge them all.")],
  (_n, me) => [M(`${me}, you look thirsty. That's not a compliment, it's a diagnosis.`)],
];

const QUIET: Exchange[] = [
  [J("I've been polishing this same glass for an hour."), M("It's very clean, darling.")],
  [M("The good glasses are just sitting there, collecting dust. Tragic.")],
  [J("Bar's open. Liver's willing. All we need is a palooza.")],
  [M("Gather the gang, sugar. I've got bitters to burn.")],
];

/**
 * Everything the bartenders might say on their scene, most pressing first.
 * The scene plays them in order, looping, so the status line comes first and
 * the jokes keep it lively while you wait.
 */
export function sceneExchanges(ctx: BanterCtx, rng: Rng = Math.random): Exchange[] {
  const { me, live, nameOf, wins } = ctx;
  const first = statusLine(ctx, rng);
  if (!me) return [first];
  if (!live) return [first, ...shuffle(QUIET, rng).slice(0, 3)];

  const others = live.participants.map((p) => nameOf(p.member_id)).filter((n): n is string => !!n && n !== me.name);
  const someone = () => (others.length ? pick(others, rng) : me.name);
  const extra: Exchange[] = [];

  if (live.event.status === "lobby") {
    const n = live.participants.length;
    if (n >= 5) extra.push([M(`${n} of you tonight! Jasper, we need a bigger ice bucket.`), J("We need a bigger bar.")]);
    else if (n >= 2) extra.push([J(`${n} at the bar. Intimate. Nowhere to hide a bad pour.`)]);
    else extra.push([M("Just you so far, sugar. Text the others. Tell them there's free booze."), J("There is not free booze.")]);

    const noRecipe = live.drinks.filter((d) => !d.has_recipe && d.member_id !== me.id).map((d) => nameOf(d.member_id)).filter((x): x is string => !!x);
    if (noRecipe.length === 1) extra.push([M(`Still no recipe from ${noRecipe[0]}.`), J(`${noRecipe[0]}, it's a cocktail, not a novel.`)]);
    else if (noRecipe.length > 1) extra.push([J(`Waiting on recipes from ${listNames(noRecipe)}. No pressure. Some pressure.`)]);
    const noPhoto = live.drinks.filter((d) => d.has_recipe && !d.hero_url && d.member_id !== me.id).map((d) => nameOf(d.member_id)).filter((x): x is string => !!x);
    if (noPhoto.length) extra.push([M(`${pick(noPhoto, rng)}, a drink without a photo didn't happen.`)]);
    if (live.drinks.length > 1 && live.drinks.every((d) => d.has_recipe && d.hero_url))
      extra.push([J("Everyone's prepped. Somebody hit start before I drink the garnishes."), M("He will, too.")]);

    const champs = live.participants.filter((p) => (wins[p.member_id] ?? 0) > 0 && p.member_id !== me.id);
    if (champs.length) {
      const c = pick(champs, rng);
      const name = nameOf(c.member_id);
      if (name) extra.push([J(`${name} has ${wins[c.member_id]} title${wins[c.member_id] === 1 ? "" : "s"}. Somebody knock 'em off the shelf.`), M(`Easy, Jasper. ${name} tips well.`)]);
    }
  } else if (live.event.status === "live") {
    const waiting = live.waiting_on.filter((id) => id !== me.id).map((id) => nameOf(id)).filter((x): x is string => !!x);
    if (waiting.length === 1) extra.push([M(`Still waiting on ${waiting[0]}'s pours. Thinking hard or drinking hard?`)]);
    const presenter = nameOf(live.current?.member_id);
    if (presenter && live.current?.member_id !== me.id) extra.push([J(`${presenter} practised that speech in the car. I'd bet on it.`)]);
  }

  const party = shuffle(PARTY, rng)
    .slice(0, 6)
    .map((f) => f(someone(), me.name));
  // Keep the status beat recurring between the jokes.
  const tail = shuffle([...extra, ...party], rng);
  const out: Exchange[] = [first];
  tail.forEach((ex, i) => {
    out.push(ex);
    if (i % 3 === 2) out.push(first);
  });
  return out;
}

// ---- In-game commentary ----------------------------------------------------

export type GameEvent =
  /** A new drink takes the stage. */
  | { kind: "stage"; presenter: string; drink: string; ingredient?: string; isMe: boolean }
  /** This phone just poured a glass. */
  | { kind: "pour"; category: CategoryKey; score: number; presenter: string; me: string }
  /** Someone else finished all four glasses. */
  | { kind: "finished"; name: string; left: number; presenterIsMe: boolean }
  /** Everyone's poured but one. */
  | { kind: "lastOne"; name: string; isMe: boolean }
  /** Every glass is in. */
  | { kind: "allIn"; presenter: string; isMe: boolean }
  /** A burst of reactions. */
  | { kind: "hype"; emoji: string; presenter: string; isMe: boolean }
  /** Someone else wrote on a napkin. */
  | { kind: "napkin"; name: string; text: string }
  /** Nothing's happened for a while. */
  | { kind: "idle"; presenter: string; someone: string; me: string };

function pourLines(e: Extract<GameEvent, { kind: "pour" }>): string[] {
  const { score, presenter: p, me, category } = e;
  if (score === 10)
    return [`A perfect ten! Somebody's sweet on ${p}.`, `A ten, ${me}? Jasper, mark it down. Frame it.`, `Ten out of ten. ${p} is going to be insufferable.`];
  if (score === 1) return [`A one?! Mabel, fetch the smelling salts.`, `Ouch, ${me}. ${p} will see that at the reveal.`, `A one. Cold-blooded, ${me}. I respect it.`];
  const high = score >= 8;
  const low = score <= 3;
  switch (category) {
    case "taste":
      if (high) return [`A ${score} on taste? Pour me one of those.`, `${p} can mix. Who knew.`, `Good, huh? Taste counts double, ${me}. You just made ${p}'s night.`];
      if (low) return [`A ${score} on taste. Somebody get ${p} a glass of water.`, `Rough, huh? I saw ${p} put something brown in there.`, `${me}'s face says it all. A ${score} for taste.`];
      return [`A ${score}. Diplomatic, ${me}.`, `Middle of the road on taste. Very Switzerland of you, ${me}.`];
    case "appearance":
      if (high) return [`A ${score} for looks. It's the garnish, isn't it?`, `Pretty enough to frame. Don't drink the frame.`];
      if (low) return [`Harsh, ${me}. The glass tried its best.`, `A ${score} for looks. ${p}, darling, presentation is everything.`];
      return [`Looks fine. Fine is a ${score}, apparently.`];
    case "creativity":
      if (high) return [`Weird in a good way, I take it.`, `${p} went off-script. A ${score}, ${me}? Bold.`];
      if (low) return [`Seen it before, huh ${me}?`, `A ${score} for creativity. ${p} played it safe.`];
      return [`A ${score}. Creative-ish.`];
    case "presentation":
      if (high) return [`${p} sold it. Somebody get them an agent.`, `A ${score} for the show! The soundboard really pulled its weight.`];
      if (low) return [`Tough crowd, ${me}. ${p} did a whole bit.`, `A ${score}. The speech needed a second draft, ${p}.`];
      return [`A ${score} for the show. Polite applause.`];
  }
}

/** One line for a game moment. */
export function gameLine(e: GameEvent, rng: Rng = Math.random): Line {
  const who: Speaker = rng() < 0.5 ? "mabel" : "jasper";
  const say = (xs: string[]): Line => ({ who, text: pick(xs, rng) });
  switch (e.kind) {
    case "stage":
      if (e.isMe) return say([`Lights are on you, ${e.presenter}. Sell that ${e.drink}!`, `Your turn, ${e.presenter}. Big smile. Hit the drum roll.`, `Knock 'em dead, ${e.presenter}. Or at least tipsy.`]);
      return say([
        `Next up: ${e.presenter} with the ${e.drink}. Brace yourselves.`,
        ...(e.ingredient ? [`${e.ingredient}? Bold choice, ${e.presenter}. Bold.`, `I smell ${e.ingredient.toLowerCase()}. ${e.presenter}, you didn't.`] : []),
        `${e.presenter} is up. Be nice. Or don't, it's anonymous.`,
        `The ${e.drink}. I'll reserve judgement. You shouldn't.`,
      ]);
    case "pour":
      return say(pourLines(e));
    case "finished":
      if (e.presenterIsMe) return say([`${e.name} has poured. Their face gave nothing away.`, `${e.name}'s verdict is in. Don't look, darling.`]);
      return say([`${e.name} is done already. Decisive.`, `${e.name} poured all four. Didn't even blink.`, `${e.name}'s finished. Probably just wants a refill.`]);
    case "lastOne":
      if (e.isMe) return say([`Everyone's waiting on you, ${e.name}! No pressure.`, `It's just you left, ${e.name}. The whole bar is staring.`]);
      return say([`All eyes on ${e.name}. Take your time. Not that much time.`, `Waiting on ${e.name}… Somebody nudge them.`, `${e.name}, darling, it's a score, not a thesis.`]);
    case "allIn":
      if (e.isMe) return say([`Every glass is poured, ${e.presenter}. Take a bow and hit Done.`, `That's everyone, ${e.presenter}! Curtain call.`]);
      return say([`Every glass is in! ${e.presenter}, take a bow.`, `That's all the pours. ${e.presenter}, you survived.`]);
    case "hype":
      if (e.isMe) return say([`They're loving it! ${e.emoji}${e.emoji}${e.emoji}`, `Listen to that crowd, ${e.presenter}!`]);
      return say([`The room's going wild! ${e.emoji}`, `${e.emoji} everywhere. ${e.presenter} has fans.`, `Easy on the ${e.emoji}, people. I just mopped.`]);
    case "napkin":
      return say([`${e.name} is writing on napkins again. Scandalous.`, `Ooh, ${e.name} has opinions.`, `${e.name} wrote "${e.text.length > 28 ? `${e.text.slice(0, 26)}…` : e.text}". Noted.`]);
    case "idle":
      return say([
        `Hydrate between pours, ${e.me}. Or don't. I'm a bartender, not a doctor.`,
        `${e.someone} has been staring at that glass a while.`,
        `Don't overthink it. It's a cocktail, not a mortgage.`,
        `Is it me or is ${e.presenter} sweating?`,
        `Anyone else's glass empty? Asking for ${e.someone}.`,
        `We're going to be drinking too much tonight, aren't we.`,
      ]);
  }
}
