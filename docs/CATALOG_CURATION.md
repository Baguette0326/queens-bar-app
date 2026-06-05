# Catalog Curation

Source: [Queen's GPA Bars Wiki](https://gpabars.fandom.com/wiki/Queen%27s_GPA_Bars_Wiki)

The MVP catalog imports Shenanigans bars from the wiki and stores their real names and source URLs. App metadata such as XP, difficulty, tags, summaries, and suggested meetup locations is provisional and should be reviewed before launch.

The active MVP catalog contains only the 41 bars marked `publish = yes` in the reviewed spreadsheet. The generated Shenanigans catalog remains available as a source for later additions, but it is not shown to users automatically.

## First Catalog Slice

| Bar | Wiki Category | Provisional Difficulty | Provisional XP |
| --- | --- | ---: | ---: |
| Advance To Goodes | Shenanigans | Easy | 100 |
| Beerio Kart | Shenanigans | Medium | 200 |
| Clark Decagon | Shenanigans | Hard | 300 |
| Fellowship | Shenanigans | Hard | 350 |
| Frost Week | Shenanigans | Medium | 200 |
| Home For A Rest | Shenanigans | Medium | 225 |
| Party Star | Shenanigans | Easy | 125 |
| Squeaky Clean | Shenanigans | Easy | 100 |
| Tap Master | Shenanigans | Medium | 200 |
| Wizard | Shenanigans | Hard | 300 |
| Bigger Is Better | Extracurricular | Easy | 100 |
| Hometown Hero | Extracurricular | Easy | 100 |

These entries have individually reviewed instruction summaries. The importer now generates short descriptions from raw wiki page content for most other entries. Generated entries still show a `Review required` tag and link to the wiki for full requirements until they are reviewed.

## Reviewed Spreadsheet

Reviewed bar descriptions are stored in `src/data/bar-sheet.json`, imported from `Bar Sheet (1).xlsx`.

- Rows marked `publish = yes` are treated as reviewed and are the only bars included in the active catalog.
- Spreadsheet descriptions override generated wiki descriptions.
- Long descriptions are shortened for the app and direct users to the wiki for full requirements.
- Spreadsheet rows can add publishable Shenanigans bars even when the wiki category list omits them.

## Curation Rules

- Include a concise paraphrase of the traditional requirement so users understand what the bar involves.
- Keep detailed historical rules on the wiki instead of copying long or high-risk drinking instructions into the app.
- Add explicit safety wording when a traditional requirement involves rapid or excessive alcohol consumption.
- Do not store structured alcohol quantities, required drink counts, chug times, or alcohol types.
- Use tags for quick context, including `Alcohol involved` when relevant.
- Treat XP and difficulty as admin-controlled balancing values.
- Link every published catalog item to a source page when possible.
- Review suggested locations so the app does not encourage truly private-room locations in the MVP.

## Browse Categories

The app uses app-owned discovery categories inferred from names and tags: `Social & Games`, `Campus & Places`, `Music & Movies`, `Long-form`, `Participation`, and `Unreviewed`.

These discovery categories are intended for navigation, not as claims about official GPA bar classification. They should be improved during catalog review.

## Next Catalog Work

1. Review generated Shenanigans entries and remove fake, duplicate, deprecated, or unsuitable meetup pages.
2. Replace generic instructions with concise paraphrases of each traditional requirement.
3. Decide later whether other bar categories belong in the meetup catalog or only in profile history.
4. Rebalance provisional XP, difficulty, tags, and suggested locations.
5. Replace placeholder interested/upcoming counts with database-derived values.
6. Create admin-curated collections after the core catalog is stable.

## Regenerating

```bash
node scripts/import-wiki-catalog.mjs
```
