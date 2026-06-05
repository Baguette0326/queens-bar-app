import { supabase } from "../lib/supabase";
import barSheetRows from "./bar-sheet.json";
import type { AvatarId, Challenge, ChallengeTone } from "./catalog";

type CatalogBarRow = {
  id: string;
  name: string;
  category: Challenge["category"];
  description: string;
  instructions: string;
  wiki_url: string;
  difficulty: "easy" | "medium" | "hard" | "legendary";
  xp: number;
  tags: string[];
  common_locations: string[];
  published: boolean;
  reviewed: boolean;
};

const toneCycle: ChallengeTone[] = ["navy", "red", "green", "paper"];
const iconCycle: AvatarId[] = ["star", "gear", "crown", "gem", "hall"];

function normalizeWikiUrl(value: string) {
  return value.trim().toLowerCase().replace(/\/$/, "");
}

const sheetRowsByUrl = new Map(barSheetRows.map((row) => [normalizeWikiUrl(row.sourceUrl), row]));

function titleDifficulty(value: string): Challenge["difficulty"] {
  if (value === "easy") return "Easy";
  if (value === "hard") return "Hard";
  if (value === "legendary") return "Legendary";
  return "Medium";
}

function sheetTags(difficulty: string) {
  const titled = titleDifficulty(difficulty);
  return difficulty === "legendary" ? [titled, "High XP"] : [titled];
}

function rowToChallenge(row: CatalogBarRow, index: number): Challenge {
  const sheetRow = sheetRowsByUrl.get(normalizeWikiUrl(row.wiki_url));
  const difficulty = sheetRow ? titleDifficulty(sheetRow.difficulty) : titleDifficulty(row.difficulty);
  const xp = sheetRow?.xp ?? row.xp;
  const tags = sheetRow ? sheetTags(sheetRow.difficulty) : row.tags ?? [];

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    difficulty,
    xp,
    tags,
    summary: sheetRow?.description ?? row.description,
    instructions: row.instructions,
    places: row.common_locations ?? ["Clark Hall", "Residence Common Area", "Other"],
    interested: 0,
    upcoming: 0,
    tone: toneCycle[index % toneCycle.length],
    icon: iconCycle[index % iconCycle.length],
    sourceUrl: row.wiki_url,
    reviewed: row.reviewed
  };
}

export async function fetchCatalogBars() {
  const { data, error } = await supabase
    .from("catalog_bars")
    .select("id,name,category,description,instructions,wiki_url,difficulty,xp,tags,common_locations,published,reviewed")
    .eq("published", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row, index) => rowToChallenge(row as CatalogBarRow, index));
}
