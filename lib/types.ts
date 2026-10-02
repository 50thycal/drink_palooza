import type { CategoryKey } from "./constants";

export type EventStatus = "lobby" | "live" | "lastcall" | "wrapped" | "complete";
export type DrinkStatus = "upcoming" | "presenting" | "done";

export interface Member {
  id: string;
  name: string;
  emoji: string;
  color: string;
  created_at: string;
}

export interface Ingredient {
  amount: string;
  item: string;
}

export interface PaloozaEvent {
  id: string;
  name: string;
  host_id: string;
  status: EventStatus;
  current_drink_id: string | null;
  order_set: boolean;
  order_version: number;
  wrap_slide: number;
  created_at: string;
  started_at: string | null;
  wrapped_at: string | null;
  completed_at: string | null;
}

export interface Participant {
  member_id: string;
  position: number | null;
  joined_at: string;
}

export interface Drink {
  id: string;
  event_id: string;
  member_id: string;
  name: string;
  story: string;
  glass: string;
  garnish: string;
  ingredients: Ingredient[];
  method: string;
  status: DrinkStatus;
  hero_photo_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  drink_id: string;
  uploader_id: string;
  url: string;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface Score {
  drink_id: string;
  member_id: string;
  category: CategoryKey;
  score: number;
}

export interface Comment {
  id: string;
  drink_id: string;
  member_id: string;
  text: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  drink_id: string;
  member_id: string;
  emoji: string;
  created_at: string;
}

/** A drink as it appears in lists: no recipe body, plus its hero image. */
export interface DrinkSummary {
  id: string;
  event_id: string;
  member_id: string;
  name: string;
  status: DrinkStatus;
  hero_url: string | null;
  has_recipe: boolean;
}

export type ScoreMap = Partial<Record<CategoryKey, number>>;

export interface LiveEvent {
  event: PaloozaEvent;
  participants: Participant[];
  drinks: DrinkSummary[];
  current: Drink | null;
  /** This phone's scores, keyed by drink then category. */
  my_scores: Record<string, ScoreMap>;
  my_notes: Record<string, string>;
  /** Who still owes a full set of scores on the current drink. */
  waiting_on: string[];
  /** Per drink: how many raters have poured all four glasses. */
  scored_counts: Record<string, number>;
  comments: Comment[];
  reactions: Reaction[];
  results: EventResults | null;
}

export interface HomeState {
  members: Member[];
  event: LiveEvent | null;
  last_complete: { id: string; name: string; champion: { member_id: string; drink_name: string; overall: number } | null } | null;
  server_time: string;
}

// ---- Results (Wrapped) ----------------------------------------------------

export interface DrinkResult {
  drink_id: string;
  member_id: string;
  name: string;
  hero_url: string | null;
  categories: ScoreMap;
  overall: number | null;
  /** Overall after normalising each rater against their own average. */
  fair: number | null;
  raters: number;
  /** Spread of raters' personal overalls for this drink. */
  spread: number | null;
  reactions: number;
}

export interface Podium {
  category: CategoryKey | "overall";
  places: { drink_id: string; member_id: string; name: string; value: number }[];
}

export interface Superlative {
  key: string;
  title: string;
  member_id: string;
  detail: string;
}

export interface EventResults {
  drinks: DrinkResult[];
  podiums: Podium[];
  overall: Podium;
  fair_winner: { drink_id: string; member_id: string } | null;
  superlatives: Superlative[];
  totals: { drinks: number; scores: number; comments: number; reactions: number; top_emoji: string | null };
}

export interface HallOfFame {
  champions: { event_id: string; event_name: string; date: string; member_id: string; drink_id: string; drink_name: string; overall: number }[];
  titles: { member_id: string; wins: number; podiums: number }[];
  best_ever: { category: CategoryKey | "overall"; drink_id: string; member_id: string; drink_name: string; event_name: string; value: number }[];
  personal_bests: { member_id: string; drink_id: string; drink_name: string; overall: number }[];
}

export interface CatalogEntry extends DrinkSummary {
  event_name: string;
  event_complete: boolean;
  overall: number | null;
  ingredients: Ingredient[];
  created_at: string;
}

export interface DrinkDetail {
  drink: Drink;
  event: { id: string; name: string; status: EventStatus };
  photos: Photo[];
  comments: Comment[];
  /** Only once the event is complete (or wrapped). */
  result: DrinkResult | null;
  my_scores: ScoreMap;
  my_note: string;
}
