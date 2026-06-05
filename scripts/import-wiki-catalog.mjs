import { mkdir, writeFile } from "node:fs/promises";

const apiUrl = "https://gpabars.fandom.com/api.php";
const categoryDefinitions = [
  { apiName: "Shenanigans", appName: "Shenanigans", difficulty: "Medium", xp: 200, tone: "navy" }
];

const excludedTitles = new Set([
  "Additional Bars",
  "Discipline Bars",
  "Essential Bars",
  "Experimental Bars",
  "Extracurricular Bars",
  "Golden Words Fake Bars",
  "Main Page",
  "Queen's GPA Bars Wiki",
  "Shenanigans",
  "The End of the wiki",
  "Where To Get Bars"
]);

async function fetchJson(params) {
  const response = await fetch(`${apiUrl}?${new URLSearchParams({ ...params, format: "json", origin: "*" })}`);
  if (!response.ok) throw new Error(`Wiki API request failed: ${response.status}`);
  return response.json();
}

async function getAllPages() {
  const pages = [];
  let continuation;
  do {
    const data = await fetchJson({
      action: "query",
      list: "allpages",
      apnamespace: "0",
      aplimit: "500",
      ...(continuation ? { apcontinue: continuation } : {})
    });
    pages.push(...data.query.allpages);
    continuation = data.continue?.apcontinue;
  } while (continuation);
  return pages;
}

async function getPageContents(pages) {
  const contents = new Map();
  for (let index = 0; index < pages.length; index += 50) {
    const batch = pages.slice(index, index + 50);
    const data = await fetchJson({
      action: "query",
      prop: "revisions",
      rvprop: "content",
      rvslots: "main",
      pageids: batch.map((page) => page.pageid).join("|")
    });
    Object.values(data.query.pages).forEach((page) => {
      contents.set(page.pageid, page.revisions?.[0]?.slots?.main?.["*"] ?? "");
    });
  }
  return contents;
}

async function getCategoryMembers(category) {
  const titles = new Set();
  let continuation;
  do {
    const data = await fetchJson({
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${category.apiName}`,
      cmnamespace: "0",
      cmlimit: "500",
      ...(continuation ? { cmcontinue: continuation } : {})
    });
    data.query.categorymembers.forEach((member) => titles.add(member.title));
    continuation = data.continue?.cmcontinue;
  } while (continuation);
  return titles;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function wikiTitle(title) {
  return encodeURIComponent(title.replace(/ /g, "_"));
}

function escapeText(text) {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function cleanDescription(title, wikitext) {
  const cleaned = wikitext
    .replace(/\[\[File:[\s\S]*?\]\]/gi, " ")
    .replace(/\[\[Category:[\s\S]*?\]\]/gi, " ")
    .replace(/\{\{[\s\S]*?\}\}/g, " ")
    .replace(/<ref[\s\S]*?<\/ref>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/={2,}[^=]+={2,}/g, " ")
    .replace(/^\s*[*#-].*$/gm, " ")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[https?:\/\/[^\s\]]+\s+([^\]]+)\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/\s+/g, " ")
    .replace(/^This article is a stub\.?/i, "")
    .replace(/^The following is a list of/i, "A list of")
    .trim();

  if (!cleaned) return `${title} is a bar documented in the GPA Bars Wiki.`;

  const sentence = cleaned.split(/(?<=[.!?])\s/)[0].trim();
  const words = sentence.split(/\s+/);
  const description = words.length > 22 ? `${words.slice(0, 22).join(" ")}...` : sentence;
  return description || `${title} is a bar documented in the GPA Bars Wiki.`;
}

function metadataFor(title, memberships) {
  const definition = categoryDefinitions.find((category) => memberships.get(category.appName)?.has(title));
  return definition ?? { appName: "Uncategorized", difficulty: "Medium", xp: 150, tone: "paper" };
}

function createEntry(page, index, memberships, idCounts, contents) {
  const title = page.title;
  const item = metadataFor(title, memberships);
  const tags =
    item.appName === "Extracurricular"
      ? '["Participation", "Community", "Review required"]'
      : `["${item.appName}", "Review required"]`;
  const icon = ["star", "gear", "crown", "gem", "hall"][index % 5];
  const places =
    item.appName === "Extracurricular"
      ? '["Queen\'s Campus", "Clark Hall", "Other"]'
      : '["Clark Hall", "Residence Common Area", "Other"]';

  const baseId = slugify(title) || `wiki-page-${page.pageid}`;
  const id = idCounts.get(baseId) > 1 ? `${baseId}-${page.pageid}` : baseId;

  const description = cleanDescription(title, contents.get(page.pageid) ?? "");

  return `  {
    id: "${id}",
    name: "${escapeText(title)}",
    category: "${item.appName}",
    difficulty: "${item.difficulty}",
    xp: ${item.xp},
    tags: ${tags},
    summary: "${escapeText(description)}",
    instructions: "Open More info for the full traditional requirements from the GPA Bars Wiki.",
    places: ${places},
    interested: 0,
    upcoming: 0,
    tone: "${item.tone}",
    icon: "${icon}",
    sourceUrl: "https://gpabars.fandom.com/wiki/${wikiTitle(title)}",
    reviewed: false
  }`;
}

const categorySets = await Promise.all(categoryDefinitions.map(getCategoryMembers));
const memberships = new Map(categoryDefinitions.map((category, index) => [category.appName, categorySets[index]]));
const shenanigans = memberships.get("Shenanigans") ?? new Set();
const pages = (await getAllPages())
  .filter((page) => !excludedTitles.has(page.title))
  .filter((page) => shenanigans.has(page.title))
  .sort((a, b) => a.title.localeCompare(b.title));
const idCounts = new Map();
pages.forEach((page) => {
  const id = slugify(page.title) || `wiki-page-${page.pageid}`;
  idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
});
const contents = await getPageContents(pages);

const output = `import type { Challenge } from "./catalog";

// Generated from all main-namespace GPA Bars Wiki article pages.
// Re-run: node scripts/import-wiki-catalog.mjs
export const generatedWikiChallenges: Challenge[] = [
${pages.map((page, index) => createEntry(page, index, memberships, idCounts, contents)).join(",\n")}
];
`;

await mkdir("src/data", { recursive: true });
await writeFile("src/data/catalog.generated.ts", output, "utf8");
console.log(`Imported ${pages.length} wiki article pages.`);
