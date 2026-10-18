// CatOI statistics – static version. All data comes from /data (see README.md).
const app = document.getElementById('app');
const E = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sum = a => Math.round(a.reduce((x, y) => x + y, 0) * 1e6) / 1e6;
const f = (v, dp) => Number(v).toFixed(dp);
const AW = {gold:'Gold', silver:'Silver', bronze:'Bronze', hm:'Honourable Mention'};

function csv(t) { // tiny CSV parser -> array of objects keyed by header
  const rows = []; let r = [], c = '', q = false; t = t.replace(/^\uFEFF/, '');
  for (let i = 0; i < t.length; i++) { const ch = t[i];
    if (q) { if (ch == '"') { if (t[i+1] == '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch == '"') q = true;
    else if (ch == ',') { r.push(c); c = ''; }
    else if (ch == '\n' || ch == '\r') { if (ch == '\r' && t[i+1] == '\n') i++; r.push(c); rows.push(r); r = []; c = ''; }
    else c += ch; }
  if (c || r.length) { r.push(c); rows.push(r); }
  const [h, ...b] = rows.filter(r => r.some(x => x !== ''));
  return b.map(r => Object.fromEntries(h.map((k, i) => [k.trim(), (r[i] ?? '').trim()])));
}
const get = async u => { const r = await fetch(u); if (!r.ok) throw Error(`Could not load ${u} (${r.status})`); return r; };
const table = async u => csv(await (await get(u)).text());

let D;
function ranks(rows) { // competition ranking: ties share the best rank
  const s = [...rows].sort((a, b) => b.total - a.total), m = new Map();
  s.forEach((r, i) => m.set(r, i && r.total == s[i-1].total ? m.get(s[i-1]) : i + 1));
  return m;
}
async function load() {
  const meta = await (await get('data/olympiads.json')).json();
  const [people, schools, dels] = await Promise.all(['people', 'schools', 'delegations'].map(n => table(`data/${n}.csv`)));
  D = {byName: {}, byId: {}, S: {}, Y: {}, dels};
  people.forEach(p => { D.byName[p.name] = p; D.byId[p.id] = p; });
  schools.forEach(s => D.S[s.code] = s.name);
  for (const y of Object.keys(meta).sort()) {
    const m = meta[y], raw = await table(`data/scores/${y}.csv`);
    const rows = raw.map(r => { const s = m.tasks.map((_, i) => parseFloat(r['q' + (i+1)]) || 0);
      return {name: r.name, p: D.byName[r.name], school: r.school, s, total: sum(s), award: (r.award || '').toLowerCase(),
        special: r.special_award || '', official: r.official !== '0'}; });
    const off = rows.filter(r => r.official), min = a => { const t = off.filter(r => r.award == a).map(r => r.total); return t.length ? Math.min(...t) : null; };
    D.Y[y] = {y, ...m, rows, off, max: sum(m.tasks.map(t => t.max)), dp: Math.max(0, ...m.tasks.map(t => t.dp)),
      schools: new Set(off.map(r => r.school)).size, allSchools: new Set(rows.map(r => r.school)).size,
      cut: {gold: min('gold'), silver: min('silver'), bronze: min('bronze')}, rank: ranks(rows)};
  }
}

const page = (title, body) => { document.title = title + ' – CatOI Statistics'; app.innerHTML = body; };
const box = (name, inner) => `<div class="basicname">${name}</div><div class="maincontent nocorner">${inner}</div>`;
const star = (a, b) => a != b ? ` (${a}*)` : '';

function yearHead(y, sel) {
  const ys = Object.keys(D.Y), i = ys.indexOf(y);
  const prev = i > 0 ? `<a href="#/${sel}/${ys[i-1]}">←</a>` : '', next = i < ys.length - 1 ? `<a href="#/${sel}/${ys[i+1]}">→</a>` : '';
  const menu = [['delegations','Delegations'],['tasks','Tasks'],['results','Results'],['olympiads','Main']]
    .map(([k, l]) => `<a class="${k == sel ? 'selected' : ''}" href="#/${k}/${y}">${l}</a>`).join('');
  return `<div class="countryinfo"><div class="countrydata olympdata"><div class="countryname">${prev}<div>CatOI ${y}</div>${next}</div><div class="countrymenu">${menu}</div></div></div>`;
}

function home() {
  page('Home', `<div class="maincontent">
  <p>This is a Cat Olympiad in Informatics statistics website.</p>
  <h3>Awards</h3>
  <ul><li>Someone is marked as unofficial if they did not participate onsite.</li>
  <li>Unlike NOI and IOI, Honourable Mention is awarded to the top non-medallist, non-zero score in each school.</li></ul>
  <p>Browse the <a href="#/olympiads">olympiads</a> or all <a href="#/tasks">tasks</a>.</p></div>`);
}

function olympiads(q) {
  let [k, dir] = (q.get('sort') || 'year_desc').split('_');
  const val = {year: Y => +Y.y, contestants: Y => Y.off.length, schools: Y => Y.schools}[k] || (Y => +Y.y);
  const ys = Object.values(D.Y).sort((a, b) => (val(a) - val(b)) * (dir == 'asc' ? 1 : -1));
  const th = (key, l) => `<th><a href="#/olympiads?sort=${key}_${k == key && dir == 'desc' ? 'asc' : 'desc'}">${l}</a>${k == key ? `<div class="sorttriangle">${dir == 'asc' ? '▲' : '▼'}</div>` : ''}</th>`;
  const first = Object.keys(D.Y)[0] - 1;
  page('Olympiads', `<div class="basicname">Olympiads</div><div class="maincontent nocorner"><table><tbody>
  <tr><th>No.</th>${th('year', 'Year')}<th>Dates</th>${th('contestants', 'Contestants')}${th('schools', 'Schools')}</tr>
  ${ys.map(Y => `<tr><td><a href="#/olympiads/${Y.y}">${Y.y - first}</a></td><td><a href="#/olympiads/${Y.y}">${Y.y}</a></td><td>${E(Y.date)}</td><td>${Y.off.length}${star(Y.rows.length, Y.off.length)}</td><td>${Y.schools}${star(Y.allSchools, Y.schools)}</td></tr>`).join('')}
  </tbody></table></div>`);
}

function olympiad(y) {
  const Y = D.Y[y]; if (!Y) return nf();
  const n = a => Y.off.filter(r => r.award == a).length, nu = a => Y.rows.filter(r => r.award == a).length;
  const medal = (a, l) => `<li>${l}: ${n(a)}${star(nu(a), n(a))}${Y.cut[a] != null ? ` (≥ ${f(Y.cut[a], Y.dp)} points)` : ''}</li>`;
  page('CatOI ' + y, yearHead(y, 'olympiads') + `<div class="maincontent"><h3>General information</h3><ul>
  <li>Date: ${E(Y.date)}</li><li>Contestants: ${Y.off.length}${star(Y.rows.length, Y.off.length)}</li>
  <li>Schools: ${Y.schools}${star(Y.allSchools, Y.schools)}</li>
  ${Y.archive ? `<li><a href="${E(Y.archive)}">Contest archive (${y})</a></li>` : ''}</ul>
  <h3>Awards</h3><ul><li>Maximum possible score: ${Y.tasks.map(t => f(t.max, t.dp)).join(' + ')} = ${f(Y.max, Y.dp)}</li>
  ${medal('gold', 'Gold medals')}${medal('silver', 'Silver medals')}${medal('bronze', 'Bronze medals')}
  <li>Honourable mentions: ${n('hm')}</li></ul>
  <p>Do note that someone is marked as unofficial if they did not participate onsite.</p>
  <p>Unlike NOI and IOI, Honourable Mention is awarded to the top non-medallist, non-zero score in each school.</p></div>`);
}

function results(y, q) {
  const Y = D.Y[y]; if (!Y) return nf();
  const unoff = q.get('unofficial') == '1'; let [k, dir] = (q.get('sort') || 'rank_asc').split('_');
  const rows = Y.rows.filter(r => unoff || r.official), rk = ranks(rows);
  const key = {rank: r => rk.get(r), score: r => -r.total, contestant: r => r.name.toLowerCase(), school: r => r.school};
  Y.tasks.forEach((_, i) => key['q' + (i+1)] = r => -r.s[i]);
  const kf = key[k] || key.rank;
  rows.sort((a, b) => ((kf(a) > kf(b)) - (kf(a) < kf(b))) * (dir == 'desc' ? -1 : 1) || rk.get(a) - rk.get(b));
  const th = (key, label, attr = 'rowspan="2"') => `<th ${attr}><a href="#/results/${y}?sort=${key}_${k == key && dir == 'asc' ? 'desc' : 'asc'}${unoff ? '&unofficial=1' : ''}">${label}</a>${k == key ? `<div class="sorttriangle">${dir == 'asc' ? '▼' : '▲'}</div>` : ''}</th>`;
  const body = rows.map(r => { const c = r.award, mark = r.official ? '' : '*';
    return `<tr><td class="${c}">${rk.get(r)}</td><td class="${c} leftalign">${r.p ? `<a href="#/people/${r.p.id}">${E(r.name)}</a>` : E(r.name)}</td>
    <td class="${c} leftalign">${E(D.S[r.school] || r.school)}</td>${r.s.map((v, i) => `<td class="${c} taskscore">${f(v, Y.tasks[i].dp)}</td>`).join('')}
    <td class="${c}">${f(r.total, Y.dp)}</td><td class="${c}">${f(r.total / Y.max * 100, 2)}%</td>
    <td class="${c}">${c ? AW[c] + (c != 'hm' ? mark : '') : ''}</td><td class="${c}">${E(r.special)}</td></tr>`; }).join('');
  page('CatOI ' + y + ' Results', yearHead(y, 'results') + `<div class="maincontent">
  <p><a href="#/results/${y}?unofficial=${unoff ? 0 : 1}">${unoff ? 'Exclude' : 'Include'} unofficial</a></p>
  <table><tbody><tr>${th('rank', 'Rank')}${th('contestant', 'Contestant')}${th('school', 'School')}
  ${Y.tasks.map((t, i) => th('q' + (i+1), E(t.id), 'rowspan="2" class="taskscore"')).join('')}${th('score', 'Score', 'colspan="2"')}
  <th rowspan="2">Award</th><th rowspan="2">Special Award(s)</th></tr><tr><th>Abs.</th><th>Rel.</th></tr>${body}</tbody></table></div>`);
}

// Builds a sortable <th>. base = hash path, k = active key, dir = active dir, def = first-click direction.
function sortTh(base, k, dir, key, label, def = 'desc', attr = 'rowspan="2"') {
  const next = k == key ? (dir == 'asc' ? 'desc' : 'asc') : def;
  return `<th ${attr}><a href="#/${base}?sort=${key}_${next}">${label}</a>${k == key ? `<div class="sorttriangle">${dir == 'asc' ? '▲' : '▼'}</div>` : ''}</th>`;
}

function tasks(year, q) {
  const ys = Object.keys(D.Y).filter(y => !year || y == year); if (!ys.length) return nf();
  let [k, dir] = (q.get('sort') || 'year_desc').split('_');
  const items = ys.flatMap(y => { const Y = D.Y[y], N = Y.off.length;
    return Y.tasks.map((t, i) => { const sc = Y.off.map(r => r.s[i]), avg = N ? sum(sc) / N : 0, full = sc.filter(v => v >= t.max).length;
      return {y, i, t, avg, rel: avg / t.max, full, fullrel: N ? full / N : 0}; }); });
  const key = {year: x => +x.y, name: x => x.t.name.toLowerCase(), max: x => x.t.max, avg: x => x.avg, avgrel: x => x.rel, full: x => x.full, fullrel: x => x.fullrel};
  const kf = key[k] || key.year, m = dir == 'asc' ? 1 : -1;
  items.sort((a, b) => ((kf(a) > kf(b)) - (kf(a) < kf(b))) * m || (a.y - b.y) * (k == 'year' ? m : -1) || a.i - b.i);
  const base = 'tasks' + (year ? '/' + year : '');
  // merge the Year cell across adjacent rows that share a year (works for any sort order)
  const body = items.map((x, n) => { const {y, i, t} = x; let yearCell = '';
    if (n == 0 || items[n-1].y != y) { let span = 1; while (items[n + span] && items[n + span].y == y) span++;
      yearCell = `<td rowspan="${span}"><a href="#/olympiads/${y}">${y}</a></td>`; }
    return `<tr>${yearCell}<td>${i + 1}</td><td>${E(t.name)}</td><td>${f(t.max, t.dp)}</td><td>${f(x.avg, 2)}</td><td>${f(x.rel * 100, 2)}%</td><td>${x.full}</td><td>${f(x.fullrel * 100, 2)}%</td></tr>`; }).join('');
  const T = (key, l, def, attr) => sortTh(base, k, dir, key, l, def, attr);
  const t = `<table><tbody><tr>${T('year', 'Year', 'desc')}<th rowspan="2">No.</th>${T('name', 'Name', 'asc')}${T('max', 'Max. Score')}
  <th colspan="2">Average Score</th><th colspan="2">Full Solutions</th></tr>
  <tr>${T('avg', 'Abs.', 'desc', '')}${T('avgrel', 'Rel.', 'desc', '')}${T('full', 'Abs.', 'desc', '')}${T('fullrel', 'Rel.', 'desc', '')}</tr>${body}</tbody></table>`;
  page('Tasks', (year ? yearHead(year, 'tasks') : '') + box('Tasks', t));
}

function schools(q) {
  let [k, dir] = (q.get('sort') || 'school_asc').split('_');
  const codes = new Set(Object.values(D.Y).flatMap(Y => Y.rows.map(r => r.school)).filter(Boolean)); // only schools with at least one contestant
  const list = [...codes].map(c => { const m = {gold: 0, silver: 0, bronze: 0};
    Object.values(D.Y).forEach(Y => Y.off.forEach(r => { if (r.school == c && m[r.award] != null) m[r.award]++; }));
    return {code: c, name: D.S[c] || c, ...m, total: m.gold + m.silver + m.bronze}; });
  // medal sort = gold, then silver, then bronze
  const key = {school: x => x.name.toLowerCase(), medals: x => x.gold * 1e6 + x.silver * 1e3 + x.bronze, total: x => x.total}, kf = key[k] || key.school, m = dir == 'asc' ? 1 : -1;
  list.sort((a, b) => ((kf(a) > kf(b)) - (kf(a) < kf(b))) * m || a.name.localeCompare(b.name));
  const T = (key, l, def, attr) => sortTh('schools', k, dir, key, l, def, attr);
  page('Schools', box('Schools', `<table><tbody><tr>${T('school', 'School', 'asc')}${T('medals', 'Medals', 'desc', 'colspan="3"')}${T('total', 'Total', 'desc')}</tr>
  <tr><th>G</th><th>S</th><th>B</th></tr>${list.map(x => `<tr><td class="leftalign">${E(x.name)}</td><td>${x.gold}</td><td>${x.silver}</td><td>${x.bronze}</td><td>${x.total}</td></tr>`).join('')}</tbody></table>`));
}

function delegations(y) {
  const Y = D.Y[y]; if (!Y) return nf();
  const rows = D.dels.filter(d => d.year == y).map(d => { const p = D.byName[d.name];
    return `<tr><td class="leftalign">${p ? `<a href="#/people/${p.id}">${E(d.name)}</a>` : E(d.name)}</td><td>${E(D.S[d.school] || d.school)}</td><td>${E(d.role)}</td></tr>`; }).join('');
  page('CatOI ' + y + ' Delegations', yearHead(y, 'delegations') + box('Delegation members', `<table><tbody><tr><th>Name</th><th>School</th><th>Role</th></tr>${rows}</tbody></table>`));
}

function person(id) {
  const p = D.byId[id]; if (!p) return nf();
  const parts = Object.values(D.Y).reverse().flatMap(Y => Y.rows.filter(r => r.p === p).map(r => ({Y, r})));
  const cnt = a => parts.filter(x => x.r.official && x.r.award == a).length, mt = Math.max(0, ...parts.map(x => x.Y.tasks.length));
  const rows = parts.map(({Y, r}) => { const c = r.award, rk = Y.rank.get(r), n = Y.rows.length;
    return `<tr><td class="${c}"><a href="#/olympiads/${Y.y}">${Y.y}</a></td><td class="${c}"><a href="#/delegations/${Y.y}">${E(D.S[r.school] || r.school)}</a></td>
    ${r.s.map((v, i) => `<td class="${c} taskscore"><a href="#/tasks/${Y.y}">${f(v, Y.tasks[i].dp)}</a></td>`).join('')}${mt > r.s.length ? `<td class="${c}" colspan="${mt - r.s.length}"></td>` : ''}
    <td class="${c}">${f(r.total, Y.dp)}</td><td class="${c}">${f(r.total / Y.max * 100, 2)}%</td><td class="${c}">${rk}/${n}</td><td class="${c}">${f(100 - (rk - 1) / n * 100, 2)}%</td>
    <td class="${c}">${c ? AW[c] + (c != 'hm' && !r.official ? '*' : '') : ''}</td><td class="${c}">${E(r.special)}</td></tr>`; }).join('');
  const dl = D.dels.filter(d => d.name == p.name).sort((a, b) => b.year - a.year);
  page(p.name, `<div class="participantinfo"><div class="participantdata"><div class="participantname"><div>${E(p.name)}</div></div>
  ${p.quote ? `<div class="alternatename" style="background:white;padding:4px 8px">“${E(p.quote)}”</div>` : ''}
  <div class="participantmedals"><div class="goldcount">${cnt('gold')}</div><div class="silvercount">${cnt('silver')}</div><div class="bronzecount">${cnt('bronze')}</div></div></div></div>
  ${parts.length ? box('Contestant', `<table><tbody><tr><th rowspan="2">Year</th><th rowspan="2">School</th><th rowspan="2" colspan="${mt}">Tasks</th><th colspan="2">Score</th><th colspan="2">Rank</th><th rowspan="2">Award</th><th rowspan="2">Special Award(s)</th></tr>
  <tr><th>Abs.</th><th>Rel.</th><th>Abs.</th><th>Rel.</th></tr>${rows}</tbody></table>`) : ''}
  ${dl.length ? box('Delegation member', `<table><tbody><tr><th>Year</th><th>School</th><th>Role</th></tr>${dl.map(d => `<tr><td><a href="#/olympiads/${d.year}">${d.year}</a></td><td>${E(D.S[d.school] || d.school)}</td><td>${E(d.role)}</td></tr>`).join('')}</tbody></table>`) : ''}`);
}

const nf = () => page('Not found', '<div class="maincontent">Page not found.</div>');
async function route() {
  try {
    if (!D) await load();
    const [path, qs] = location.hash.slice(1).split('?'), [a, b] = path.split('/').filter(Boolean), q = new URLSearchParams(qs || '');
    ({undefined: home, olympiads: () => b ? olympiad(b) : olympiads(q), results: () => results(b, q), tasks: () => tasks(b, q), schools: () => schools(q),
      delegations: () => delegations(b), people: () => person(b)}[a] || nf)();
    window.scrollTo(0, 0);
  } catch (e) { app.innerHTML = `<div class="maincontent warning">${E(e.message)}</div>`; console.error(e); }
}
addEventListener('hashchange', route); route();
