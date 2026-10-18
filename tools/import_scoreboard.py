"""Convert a Codebreaker/CMS scoreboard export into data/scores/<year>.csv.
Usage: python tools/import_scoreboard.py export.csv 2026 NUM_TASKS
Export columns: Rank, Username, <task scores...>, Total, [Time], Award, School code
(add 'Award' and 'School code' columns to the export first if it lacks them)."""
import csv, sys
src, year, n = sys.argv[1], sys.argv[2], int(sys.argv[3])
people = {r['name'] for r in csv.DictReader(open('data/people.csv', encoding='utf-8'))}
rd = csv.reader(open(src, encoding='utf-8-sig')); h = [c.strip().lower() for c in next(rd)]
col = lambda name: h.index(name) if name in h else None
ai, si = col('award'), col('school code')
with open(f'data/scores/{year}.csv', 'w', newline='', encoding='utf-8') as o:
    w = csv.writer(o); w.writerow(['name', 'school'] + [f'q{i}' for i in range(1, n+1)] + ['award', 'special_award', 'official'])
    for r in rd:
        if not r: continue
        if r[1] not in people: print('not in people.csv:', r[1])
        w.writerow([r[1], r[si] if si is not None else '', *r[2:2+n], r[ai].lower() if ai is not None else '', '', 1])
print('wrote', f'data/scores/{year}.csv', '- now add the year to data/olympiads.json')
