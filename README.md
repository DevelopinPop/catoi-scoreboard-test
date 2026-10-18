# CatOI Statistics (static, GitHub Pages)

No server or database: the site reads everything in `data/` in the browser.

| File | Contents |
|---|---|
| `data/olympiads.json` | one entry per year: `date`, `archive`, and `tasks` (`name`, `id`, `max`, `dp` = decimal places) |
| `data/scores/<year>.csv` | scoreboard: `name,school,q1..qN,award,special_award,official` |
| `data/people.csv` | `id,name,codebreaker,codeforces,quote` (scoreboard `name` must match) |
| `data/schools.csv` | `code,name` |
| `data/delegations.csv` | `name,school,year,role` |

## Adding a new scoreboard
1. `python tools/import_scoreboard.py export.csv 2026 8` (or write `data/scores/2026.csv` by hand).
2. Add `"2026": {"date": ..., "archive": ..., "tasks": [...]}` to `data/olympiads.json`.
3. Add new contestants to `data/people.csv` and new schools to `data/schools.csv`. Unknown names still show up, just without a profile link.

Award is one of `gold, silver, bronze, hm` or empty; `official` is `1` or `0`. Ranks, cutoffs, averages and medal counts are computed automatically.

## Deploy
Live at https://developinpop.github.io/catoi-scoreboard-test/ . Push this folder to the `catoi-scoreboard-test` repo → Settings → Pages → deploy from branch (root). To preview locally: `python -m http.server`.
