import { generatedWikiChallenges } from "./catalog.generated";
import barSheetRows from "./bar-sheet.json";

export type AvatarId = "crown" | "gear" | "cap" | "gem" | "hall" | "star";
export type ChallengeTone = "navy" | "red" | "green" | "paper";
export type BrowseCategory =
  | "Extracurricular"
  | "Uncategorized"
  | "Social & Games"
  | "Campus & Places"
  | "Music & Movies"
  | "Long-form"
  | "Participation"
  | "Discipline"
  | "Experimental"
  | "Essential"
  | "Unreviewed";

export type Challenge = {
  id: string;
  name: string;
  category: "Shenanigans" | "Experimental" | "Extracurricular" | "Discipline" | "Essential" | "Uncategorized";
  difficulty: "Easy" | "Medium" | "Hard" | "Legendary";
  xp: number;
  tags: string[];
  summary: string;
  instructions: string;
  places: string[];
  interested: number;
  upcoming: number;
  tone: ChallengeTone;
  icon: AvatarId;
  sourceUrl: string;
  reviewed: boolean;
};

const wiki = "https://gpabars.fandom.com/wiki/";

// XP, difficulty, tags, and locations are provisional app metadata.
// Names, categories, and source URLs are based on the GPA Bars Wiki.
export const curatedChallenges: Challenge[] = [
  {
    id: "advance-to-goodes",
    name: "Advance To Goodes",
    category: "Shenanigans",
    difficulty: "Easy",
    xp: 100,
    tags: ["Campus", "Goodes", "Starter"],
    summary: "A Goodes Hall-centered bar from the GPA Bars Wiki.",
    instructions:
      "Traditional requirement: travel to Goodes Hall as directed by the bar's wiki entry. Coordinate the meetup and review the source before attempting it.",
    places: ["Goodes Hall", "RCH Lobby", "Clark Hall"],
    interested: 420,
    upcoming: 8,
    tone: "navy",
    icon: "hall",
    sourceUrl: `${wiki}Advance_To_Goodes`,
    reviewed: true
  },
  {
    id: "beerio-kart",
    name: "Beerio Kart",
    category: "Shenanigans",
    difficulty: "Medium",
    xp: 200,
    tags: ["Game", "Team", "Indoor", "Alcohol involved"],
    summary: "A Mario Kart-themed social bar with several traditional variations.",
    instructions:
      "Traditional requirement: play Mario Kart while following a group-agreed drinking-game variation, with the drink completed before finishing the race. Do not pressure anyone to drink or participate.",
    places: ["Residence Common Area", "Student House Common Area", "Other"],
    interested: 516,
    upcoming: 11,
    tone: "red",
    icon: "star",
    sourceUrl: `${wiki}Beerio_Kart`,
    reviewed: true
  },
  {
    id: "clark-decagon",
    name: "Clark Decagon",
    category: "Shenanigans",
    difficulty: "Hard",
    xp: 300,
    tags: ["Clark Hall", "Classic", "Group"],
    summary: "A Clark Hall-related bar listed in the GPA Bars Wiki.",
    instructions:
      "Traditional requirement: complete the timed Clark Hall Ritual challenge described on the wiki. This is a high-risk drinking challenge; the app does not recommend or instruct rapid alcohol consumption.",
    places: ["Clark Hall", "University Ave", "Goodes Hall"],
    interested: 608,
    upcoming: 9,
    tone: "green",
    icon: "crown",
    sourceUrl: `${wiki}Clark_Decagon`,
    reviewed: true
  },
  {
    id: "fellowship",
    name: "Fellowship",
    category: "Shenanigans",
    difficulty: "Hard",
    xp: 350,
    tags: ["Movie", "Long-form", "Team", "Alcohol involved"],
    summary: "A Lord of the Rings extended-edition marathon bar.",
    instructions:
      "Traditional requirement: watch all three extended-edition Lord of the Rings films consecutively and follow the movie-trigger rules described on the wiki. This is a 12+ hour activity; agree on a safe version before starting.",
    places: ["Residence Common Area", "Student House Common Area", "Other"],
    interested: 289,
    upcoming: 4,
    tone: "navy",
    icon: "gem",
    sourceUrl: `${wiki}Fellowship`,
    reviewed: true
  },
  {
    id: "frost-week",
    name: "Frost Week",
    category: "Shenanigans",
    difficulty: "Medium",
    xp: 200,
    tags: ["Winter", "Campus", "Tradition"],
    summary: "A winter-themed bar listed in the GPA Bars Wiki.",
    instructions:
      "Traditional requirement: wear the GPA with the wiki's specified warm-weather outfit from the first class through the final class of the first winter-semester week.",
    places: ["Clark Hall", "Goodes Hall", "University Ave"],
    interested: 241,
    upcoming: 5,
    tone: "paper",
    icon: "star",
    sourceUrl: `${wiki}Frost_Week`,
    reviewed: true
  },
  {
    id: "home-for-a-rest",
    name: "Home For A Rest",
    category: "Shenanigans",
    difficulty: "Medium",
    xp: 225,
    tags: ["Music", "Social", "Classic"],
    summary: "A music-themed bar listed in the GPA Bars Wiki.",
    instructions:
      "Traditional requirement: complete the song-timed Home For A Rest challenge described on the wiki. This is a high-risk rapid-drinking challenge; the app does not recommend or instruct rapid alcohol consumption.",
    places: ["Clark Hall", "Residence Common Area", "Other"],
    interested: 377,
    upcoming: 7,
    tone: "red",
    icon: "crown",
    sourceUrl: `${wiki}Home_For_A_Rest`,
    reviewed: true
  },
  {
    id: "party-star",
    name: "Party Star",
    category: "Shenanigans",
    difficulty: "Easy",
    xp: 125,
    tags: ["Social", "Game", "Starter"],
    summary: "A social bar listed in the GPA Bars Wiki.",
    instructions:
      "Traditional requirement: complete a full four-player, no-CPU Mario Party game while following the mini-game and star-event drinking rules described on the wiki.",
    places: ["Residence Common Area", "Clark Hall", "Other"],
    interested: 193,
    upcoming: 6,
    tone: "green",
    icon: "star",
    sourceUrl: `${wiki}Party_Star`,
    reviewed: true
  },
  {
    id: "squeaky-clean",
    name: "Squeaky Clean",
    category: "Shenanigans",
    difficulty: "Easy",
    xp: 100,
    tags: ["Lighthearted", "Group", "Starter"],
    summary: "A lighthearted bar listed in the GPA Bars Wiki.",
    instructions:
      "Traditional requirement: shower in every named residence building within the wiki's time window. Respect residence access, privacy, and community rules.",
    places: ["Residence Common Area", "Goodes Hall", "Other"],
    interested: 164,
    upcoming: 3,
    tone: "paper",
    icon: "gem",
    sourceUrl: `${wiki}Squeaky_Clean`,
    reviewed: true
  },
  {
    id: "tap-master",
    name: "Tap Master",
    category: "Shenanigans",
    difficulty: "Medium",
    xp: 200,
    tags: ["Social", "Classic", "Alcohol involved"],
    summary: "A classic social bar listed in the GPA Bars Wiki.",
    instructions:
      "Traditional requirement: make your own beer, wine, or similar drink and consume it as described by the wiki entry. Follow residence rules and do not pressure anyone to drink.",
    places: ["Clark Hall", "Residence Common Area", "Other"],
    interested: 322,
    upcoming: 8,
    tone: "navy",
    icon: "gear",
    sourceUrl: `${wiki}Tap_Master`,
    reviewed: true
  },
  {
    id: "wizard",
    name: "Wizard",
    category: "Shenanigans",
    difficulty: "Hard",
    xp: 300,
    tags: ["Classic", "Long-form", "Alcohol involved"],
    summary: "A well-known bar listed in the GPA Bars Wiki.",
    instructions:
      "Traditional requirement: build a free-standing staff from finished cans to your height within the wiki's time frame. This is a high-risk drinking challenge; the app does not recommend or instruct excessive alcohol consumption.",
    places: ["Residence Common Area", "Student House Common Area", "Other"],
    interested: 742,
    upcoming: 14,
    tone: "red",
    icon: "crown",
    sourceUrl: `${wiki}Wizard`,
    reviewed: true
  },
  {
    id: "bigger-is-better",
    name: "Bigger Is Better",
    category: "Extracurricular",
    difficulty: "Easy",
    xp: 100,
    tags: ["Residence", "Community", "Participation"],
    summary: "A residence bar listed in the GPA Bars Wiki.",
    instructions:
      "Traditional requirement: this is a residence-specific bar. You must live in the applicable residence; check the wiki source for the exact eligibility requirement.",
    places: ["Residence Common Area", "Residence Lobby", "Other"],
    interested: 118,
    upcoming: 2,
    tone: "green",
    icon: "hall",
    sourceUrl: `${wiki}Bigger_is_Better`,
    reviewed: true
  },
  {
    id: "hometown-hero",
    name: "Hometown Hero",
    category: "Extracurricular",
    difficulty: "Easy",
    xp: 100,
    tags: ["Hometown", "Community", "Participation"],
    summary: "A hometown bar listed in the GPA Bars Wiki.",
    instructions:
      "Traditional requirement: this bar is for students whose hometown is Kingston, Ontario.",
    places: ["Queen's Campus", "Clark Hall", "Other"],
    interested: 205,
    upcoming: 3,
    tone: "paper",
    icon: "star",
    sourceUrl: `${wiki}Hometown_Hero`,
    reviewed: true
  }
];

const activeCuratedChallenges = curatedChallenges.filter((challenge) => challenge.category === "Shenanigans");
const curatedIds = new Set(activeCuratedChallenges.map((challenge) => challenge.id));
const sheetRowsByUrl = new Map(barSheetRows.map((row) => [normalizeWikiUrl(row.sourceUrl), row]));

function normalizeWikiUrl(url: string) {
  return decodeURIComponent(url).replace(/_/g, " ").replace(/\/+$/, "").toLowerCase();
}

function summarizeDescription(description: string) {
  const cleaned = description
    .replace(/\s+/g, " ")
    .replace(/\bf\*{3,}ing\b/gi, "very")
    .replace(/\bdank AF\b/gi, "bold")
    .replace(/\bbadass-ery\b/gi, "style")
    .replace(/\bdisgustingly difficult\b/gi, "notoriously difficult")
    .replace(/\bshit\b/gi, "challenge")
    .trim();
  if (cleaned.length <= 220) return cleaned;

  const firstSentence = cleaned.split(/(?<=[.!?])\s/)[0]?.trim();
  if (firstSentence && firstSentence.length <= 220) return `${firstSentence} See the wiki for full requirements.`;

  const words = cleaned.split(/\s+/).slice(0, 28).join(" ");
  return `${words}... See the wiki for full requirements.`;
}

const contentOverrides = new Map<string, { summary: string; instructions?: string }>([
  [
    normalizeWikiUrl("https://gpabars.fandom.com/wiki/Beerlin_Wall"),
    {
      summary:
        "Work with a group to cover a residence Don's door with finished cans in a single night, creating a temporary wall inspired by the original Beerlyn Wall.",
      instructions: "Refer to the linked wiki page for the full traditional requirements and residence considerations."
    }
  ],
  [
    normalizeWikiUrl("https://gpabars.fandom.com/wiki/Drink_to_the_Future"),
    {
      summary:
        "Watch the complete Back to the Future trilogy back-to-back while following a set of recurring phrase-based drinking cues throughout the films.",
      instructions: "Refer to the linked wiki page for the full cue list and traditional requirements."
    }
  ],
  [
    normalizeWikiUrl("https://gpabars.fandom.com/wiki/DUSTED"),
    {
      summary:
        "DUSTED stands for 'Drink an Unsuspecting Small Town Establishment Dry.' A group visits a smaller establishment outside Kingston and makes a spirited attempt at the challenge.",
      instructions: "Refer to the linked wiki page for the traditional interpretation and plan transportation responsibly."
    }
  ],
  [
    normalizeWikiUrl("https://gpabars.fandom.com/wiki/Fellowship"),
    {
      summary:
        "Watch all three extended-edition Lord of the Rings films consecutively while following recurring character, dialogue, and scene-based drinking cues.",
      instructions: "This is a 12+ hour group challenge. Refer to the linked wiki page for the full traditional cue list."
    }
  ],
  [
    normalizeWikiUrl("https://gpabars.fandom.com/wiki/Frost_Week"),
    {
      summary:
        "Wear the GPA with a deliberately summer-inspired outfit throughout the first week of the winter semester, from the first class to the final class.",
      instructions: "Refer to the linked wiki page for the traditional outfit details and full requirements."
    }
  ],
  [
    normalizeWikiUrl("https://gpabars.fandom.com/wiki/Home_For_A_Rest"),
    {
      summary:
        "A fast-paced, song-timed group challenge set to 'Home for a Rest' by Spirit of the West.",
      instructions: "Refer to the linked wiki page for the full traditional requirements before attempting this challenge."
    }
  ],
  [
    normalizeWikiUrl("https://gpabars.fandom.com/wiki/ILCBO"),
    {
      summary:
        "A small group moves through the ILC group rooms, alternating participants as they complete the challenge at each room.",
      instructions: "Refer to the linked wiki page for the full traditional requirements and current room layout."
    }
  ],
  [
    normalizeWikiUrl("https://gpabars.fandom.com/wiki/Isengard"),
    {
      summary:
        "A large-group construction challenge inspired by Wizard: participants collect and stack finished cans into a tower intended to match the height of Waldron Tower.",
      instructions: "Refer to the linked wiki page for the full construction and participation requirements."
    }
  ],
  [
    normalizeWikiUrl("https://gpabars.fandom.com/wiki/Naked_Knights"),
    {
      summary:
        "A medieval-themed streaking challenge traditionally completed while wearing a knight helmet and shoes.",
      instructions: "Refer to the linked wiki page for the full traditional requirements and consider privacy, consent, and local rules."
    }
  ]
]);

function applySheetOverride(challenge: Challenge): Challenge {
  const row = sheetRowsByUrl.get(normalizeWikiUrl(challenge.sourceUrl));
  if (!row) return challenge;
  const override = contentOverrides.get(normalizeWikiUrl(challenge.sourceUrl));

  return {
    ...challenge,
    difficulty: titleDifficulty(row.difficulty),
    xp: row.xp,
    summary: override?.summary ?? summarizeDescription(row.description),
    instructions: override?.instructions ?? "Refer to the linked wiki page for the full traditional requirements before organizing this bar.",
    tags: [...new Set([...challenge.tags.filter((tag) => tag !== "Review required" && tag !== "Shenanigans"), ...tagsFromSheetRow(row)])],
    reviewed: true
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugFromSourceUrl(sourceUrl: string, fallbackName: string) {
  const pageName = sourceUrl.split("/").pop();
  return slugify(pageName ? decodeURIComponent(pageName).replace(/_/g, " ") : fallbackName);
}

function challengeFromSheetRow(row: (typeof barSheetRows)[number]): Challenge {
  const override = contentOverrides.get(normalizeWikiUrl(row.sourceUrl));
  return {
    id: slugFromSourceUrl(row.sourceUrl, row.name),
    name: row.name,
    category: "Shenanigans",
    difficulty: titleDifficulty(row.difficulty),
    xp: row.xp,
    tags: tagsFromSheetRow(row),
    summary: override?.summary ?? summarizeDescription(row.description),
    instructions: override?.instructions ?? "Refer to the linked wiki page for the full traditional requirements before organizing this bar.",
    places: ["Clark Hall", "Residence Common Area", "Other"],
    interested: 0,
    upcoming: 0,
    tone: "navy",
    icon: "star",
    sourceUrl: row.sourceUrl,
    reviewed: true
  };
}

function titleDifficulty(value: string): Challenge["difficulty"] {
  const normalized = value.toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "hard") return "Hard";
  if (normalized === "legendary") return "Legendary";
  return "Medium";
}

function tagsFromSheetRow(row: (typeof barSheetRows)[number]) {
  const tags = new Set<string>();
  tags.add(titleDifficulty(row.difficulty));
  if (row.difficulty === "legendary") tags.add("High XP");
  return [...tags];
}

const availableChallenges: Challenge[] = [
  ...activeCuratedChallenges,
  ...generatedWikiChallenges.filter((challenge) => !curatedIds.has(challenge.id))
].map(applySheetOverride);
const availableByUrl = new Map(availableChallenges.map((challenge) => [normalizeWikiUrl(challenge.sourceUrl), challenge]));

export const challenges: Challenge[] = barSheetRows
  .map((row) => availableByUrl.get(normalizeWikiUrl(row.sourceUrl)) ?? challengeFromSheetRow(row))
  .sort((a, b) => a.name.localeCompare(b.name));

const socialKeywords = [
  "beerio",
  "party",
  "wizard",
  "kart",
  "mario",
  "game",
  "pong",
  "flip cup",
  "tap master",
  "social"
];
const campusKeywords = [
  "goodes",
  "clark",
  "campus",
  "caf",
  "cafeteria",
  "cafeterias",
  "stauffer",
  "residence",
  "kingston",
  "engsoc",
  "arc",
  "jeffery",
  "dunning"
];
const mediaKeywords = [
  "movie",
  "film",
  "song",
  "music",
  "fellowship",
  "lord of the rings",
  "star wars",
  "harry potter",
  "album",
  "home for a rest"
];
const longFormKeywords = ["24/7", "week", "marathon", "40 days", "100", "century", "millennium", "all nighter"];

function hasKeyword(challenge: Challenge, keywords: string[]) {
  const text = `${challenge.name} ${challenge.summary} ${challenge.instructions} ${challenge.tags.join(" ")}`.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword));
}

export function getBrowseCategories(challenge: Challenge): BrowseCategory[] {
  const categories = new Set<BrowseCategory>();

  if (hasKeyword(challenge, socialKeywords)) categories.add("Social & Games");
  if (hasKeyword(challenge, campusKeywords)) categories.add("Campus & Places");
  if (hasKeyword(challenge, mediaKeywords)) categories.add("Music & Movies");
  if (hasKeyword(challenge, longFormKeywords) || challenge.tags.includes("Long-form")) categories.add("Long-form");
  if (challenge.category === "Extracurricular" || challenge.tags.includes("Participation")) categories.add("Participation");
  if (challenge.category === "Extracurricular") categories.add("Extracurricular");
  if (challenge.category === "Uncategorized") categories.add("Uncategorized");
  if (challenge.category === "Discipline") categories.add("Discipline");
  if (challenge.category === "Experimental") categories.add("Experimental");
  if (challenge.category === "Essential") categories.add("Essential");
  if (challenge.tags.includes("Review required")) categories.add("Unreviewed");

  return [...categories];
}
