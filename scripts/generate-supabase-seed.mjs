import fs from "node:fs/promises";
import bars from "../src/data/bar-sheet.json" with { type: "json" };

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugFromSourceUrl(sourceUrl, fallbackName) {
  const pageName = sourceUrl.split("/").pop();
  return slugify(pageName ? decodeURIComponent(pageName).replace(/_/g, " ") : fallbackName);
}

function sql(value) {
  if (Array.isArray(value)) return `array[${value.map(sql).join(", ")}]::text[]`;
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function summarize(description) {
  const cleaned = description.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 220) return cleaned;
  const firstSentence = cleaned.split(/(?<=[.!?])\s/)[0]?.trim();
  if (firstSentence && firstSentence.length <= 220) return `${firstSentence} See the wiki for full requirements.`;
  return `${cleaned.split(/\s+/).slice(0, 28).join(" ")}... See the wiki for full requirements.`;
}

const rows = bars.map((bar) => ({
  id: slugFromSourceUrl(bar.sourceUrl, bar.name),
  name: bar.name,
  category: "Shenanigans",
  description: summarize(bar.description),
  instructions: "Refer to the linked wiki page for the full traditional requirements before organizing this bar.",
  wiki_url: bar.sourceUrl,
  difficulty: bar.difficulty ?? "medium",
  xp: bar.xp ?? 200,
  tags: [bar.difficulty ? `${bar.difficulty[0].toUpperCase()}${bar.difficulty.slice(1)}` : "Medium"],
  common_locations: ["Clark Hall", "Residence Common Area", "Other"],
  published: true,
  reviewed: true
}));

const values = rows
  .map(
    (row) =>
      `(${[
        sql(row.id),
        sql(row.name),
        sql(row.category),
        sql(row.description),
        sql(row.instructions),
        sql(row.wiki_url),
        sql(row.difficulty),
        sql(row.xp),
        sql(row.tags),
        sql(row.common_locations),
        sql(row.published),
        sql(row.reviewed)
      ].join(", ")})`
  )
  .join(",\n");

const output = `-- Seed approved MVP catalog bars from src/data/bar-sheet.json
insert into public.catalog_bars (
  id,
  name,
  category,
  description,
  instructions,
  wiki_url,
  difficulty,
  xp,
  tags,
  common_locations,
  published,
  reviewed
)
values
${values}
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  instructions = excluded.instructions,
  wiki_url = excluded.wiki_url,
  difficulty = excluded.difficulty,
  xp = excluded.xp,
  tags = excluded.tags,
  common_locations = excluded.common_locations,
  published = excluded.published,
  reviewed = excluded.reviewed,
  updated_at = now();
`;

await fs.mkdir("supabase", { recursive: true });
await fs.writeFile("supabase/seed_catalog.sql", output, "utf8");
console.log(`Wrote ${rows.length} catalog rows to supabase/seed_catalog.sql`);
