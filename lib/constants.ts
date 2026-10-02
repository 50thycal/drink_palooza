/**
 * The four things every drink is judged on. Keys are what the database stores;
 * everything a player sees (glass, colour, blurb) hangs off these definitions.
 * Taste counts double in the overall score.
 */
export const CATEGORIES = [
  {
    key: "taste",
    label: "Taste",
    glass: "The Stoic",
    blurb: "Balance, flavour, would you order it again?",
    weight: 2,
  },
  {
    key: "appearance",
    label: "Appearance",
    glass: "The Showpiece",
    blurb: "Colour, glassware, garnish. Does it look the part?",
    weight: 1,
  },
  {
    key: "creativity",
    label: "Creativity",
    glass: "The Wild Card",
    blurb: "Originality. Combinations nobody saw coming.",
    weight: 1,
  },
  {
    key: "presentation",
    label: "Presentation",
    glass: "The Showstopper",
    blurb: "The pitch. The story. The theatre of serving it.",
    weight: 1,
  },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as CategoryKey[];

export const SCORE_MIN = 1;
export const SCORE_MAX = 10;

/** Quick reactions in the emoji tray while someone presents. */
export const REACTIONS = ["🔥", "😍", "🤤", "😂", "🤯", "👏", "🥴", "🍋"] as const;

/** Soundboard buttons. Each also posts its emoji to the reaction stream. */
export const SOUNDS = [
  { key: "womp", emoji: "🎺", label: "Womp womp", mood: "Sad" },
  { key: "rimshot", emoji: "🥁", label: "Ba-dum-tss", mood: "Joke" },
  { key: "applause", emoji: "👏", label: "Applause", mood: "Happy" },
  { key: "airhorn", emoji: "📯", label: "Air horn", mood: "Hype" },
  { key: "drumroll", emoji: "🪘", label: "Drumroll", mood: "Suspense" },
  { key: "boom", emoji: "💥", label: "Explosion", mood: "Mind blown" },
] as const;
export type SoundKey = (typeof SOUNDS)[number]["key"];

export const MEMBER_EMOJIS = ["🍸", "🍹", "🥃", "🍷", "🍾", "🍋", "🍒", "🫒", "🧊", "🌿", "🍍", "🥥", "🌶️", "🫐", "☕", "🎩"];
export const MEMBER_COLORS = ["#ff4fa3", "#3ff2e0", "#ffb547", "#9d7bff", "#5be37d", "#ff7a45", "#4fb3ff", "#f5e663", "#ff5c5c", "#c58bff"];

/** How long a reaction stays in the live stream payload. */
export const REACTION_WINDOW_SEC = 20;
