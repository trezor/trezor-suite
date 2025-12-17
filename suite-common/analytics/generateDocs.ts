// suite-common/analytics/generateDocs.ts
//
// Pretty HTML docs for analytics events.
// - merge desktop/mobile/shared exports into a single events map
// - attach `platform` array to each event so HTML shows platform categorization
// - render a readable documentation (cards, grouped attributes, badges, markdown changelog)

import { writeFileSync } from 'node:fs';
import path from 'node:path';

import * as analyticsEvents from './src/events/analyticsEvents';

const desktopMap: Record<string, any> = (analyticsEvents as any).desktopEvents ?? {};
const mobileMap: Record<string, any> = (analyticsEvents as any).mobileEvents ?? {};
const sharedMap: Record<string, any> = (analyticsEvents as any).sharedEvents ?? {};

const combinedEvents: Record<string, any> = {};

function addEvent(key: string, ev: any, labels: Array<'desktop' | 'mobile'>) {
    if (!combinedEvents[key]) {
        combinedEvents[key] = { ...ev, platform: Array.from(new Set(labels)) };
    } else {
        const existing = combinedEvents[key];
        existing.platform = Array.from(new Set([...(existing.platform ?? []), ...labels]));
    }
}

for (const [k, v] of Object.entries(desktopMap)) addEvent(k, v, ['desktop']);
for (const [k, v] of Object.entries(mobileMap)) addEvent(k, v, ['mobile']);
for (const [k, v] of Object.entries(sharedMap)) addEvent(k, v, ['desktop', 'mobile']);

const events: Record<string, any> = combinedEvents;

if (!events || Object.keys(events).length === 0) {
     
    console.warn(
        'No analytics events found in ./src/events/analyticsEvents (desktop/mobile/shared maps are empty)',
    );
}

type Event = (typeof events)[keyof typeof events];

type AttrDoc = {
    name: string;
    runtimeType: string;
    definition?: string;
    description?: string;
    limitations?: string;
    addedInVersion?: string;
    lastUpdatedInVersion?: string;
    removedInVersion?: string;
    changelog?: string;
};

type EventDoc = {
    key: string;
    name: string;
    descriptionTrigger?: string;
    platforms: Array<'desktop' | 'mobile'>;
    addedInVersion?: string;
    lastUpdatedInVersion?: string;
    removedInVersion?: string;
    changelog?: string;
    attributes: AttrDoc[];
};

const escapeHtml = (str: string | undefined | null): string =>
    (str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

function versionWeight(v?: string): number {
    // best-effort parse "x.y.z" into sortable number; unknown -> 0
    if (!v) return 0;
    const m = v.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!m) return 0;
    const a = Number(m[1]);
    const b = Number(m[2]);
    const c = Number(m[3]);

    return a * 1_000_000 + b * 1_000 + c;
}

/**
 * Minimal markdown → HTML renderer (no deps).
 * Supports:
 * - headings (#, ##, ###)
 * - bold **x**
 * - italic *x*
 * - inline code `x`
 * - links [text](url)
 * - unordered lists (-, *)
 * - paragraphs + line breaks
 */
function mdToHtml(md?: string): string {
    const src = (md ?? '').trim();
    if (!src) return '';

    const lines = src.split('\n');

    let html = '';
    let inUl = false;

    const inline = (s: string) => {
        let x = escapeHtml(s);

        // inline code
        x = x.replace(/`([^`]+)`/g, '<code>$1</code>');
        // links
        x = x.replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
        );
        // bold
        x = x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // italic (simple)
        x = x.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        return x;
    };

    const closeUl = () => {
        if (inUl) {
            html += '</ul>';
            inUl = false;
        }
    };

    for (const raw of lines) {
        const line = raw.trimRight();

        if (!line.trim()) {
            closeUl();
            continue;
        }

        const h3 = line.match(/^###\s+(.*)$/);
        const h2 = line.match(/^##\s+(.*)$/);
        const h1 = line.match(/^#\s+(.*)$/);
        const li = line.match(/^[-*]\s+(.*)$/);

        if (h1) {
            closeUl();
            html += `<h4>${inline(h1[1])}</h4>`;
            continue;
        }
        if (h2) {
            closeUl();
            html += `<h5>${inline(h2[1])}</h5>`;
            continue;
        }
        if (h3) {
            closeUl();
            html += `<h6>${inline(h3[1])}</h6>`;
            continue;
        }

        if (li) {
            if (!inUl) {
                html += '<ul>';
                inUl = true;
            }
            html += `<li>${inline(li[1])}</li>`;
            continue;
        }

        closeUl();
        html += `<p>${inline(line)}</p>`;
    }

    closeUl();

    return html;
}

function buildDocs(): EventDoc[] {
    const docs: EventDoc[] = [];

    for (const [eventKey, ev] of Object.entries(events ?? {})) {
        const event = ev as Event;

        const platforms: Array<'desktop' | 'mobile'> = Array.isArray((event as any).platform)
            ? ((event as any).platform as Array<'desktop' | 'mobile'>)
            : [];

        const attrs = event.attributes ? Object.entries(event.attributes) : [];

        const attrDocs: AttrDoc[] = attrs
            .filter(([, a]) => !!a)
            .map(([attrName, attr]) => {
                const runtimeType = typeof (attr as any).value;

                return {
                    name: attrName,
                    runtimeType,
                    definition: (attr as any).definition,
                    description: (attr as any).description,
                    limitations: (attr as any).limitations,
                    addedInVersion: (attr as any).addedInVersion,
                    lastUpdatedInVersion: (attr as any).lastUpdatedInVersion,
                    removedInVersion: (attr as any).removedInVersion,
                    changelog: (attr as any).changelog,
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        docs.push({
            key: eventKey,
            name: String((event as any).name),
            descriptionTrigger: (event as any).descriptionTrigger,
            platforms,
            addedInVersion: (event as any).addedInVersion,
            lastUpdatedInVersion: (event as any).lastUpdatedInVersion,
            removedInVersion: (event as any).removedInVersion,
            changelog: (event as any).changelog,
            attributes: attrDocs,
        });
    }

    // default sort: name
    docs.sort((a, b) => a.name.localeCompare(b.name));

    return docs;
}

function renderHtml(): string {
    const docs = buildDocs();
    const now = new Date().toISOString();

    const eventCardsHtml = docs
        .map(d => {
            const hasRemoved = !!d.removedInVersion;
            const platformsLabel = d.platforms.length === 2 ? 'both' : (d.platforms[0] ?? '—');

            const versionBadges = [
                d.addedInVersion ? renderVersionBadge('added', d.addedInVersion) : '',
                d.lastUpdatedInVersion ? renderVersionBadge('updated', d.lastUpdatedInVersion) : '',
                d.removedInVersion ? renderVersionBadge('removed', d.removedInVersion) : '',
            ]
                .filter(Boolean)
                .join('');

            const platformBadges = d.platforms
                .map(p => `<span class="badge badge-platform">${escapeHtml(p)}</span>`)
                .join('');

            const changelogHtml = d.changelog
                ? `<div class="md">${mdToHtml(d.changelog)}</div>`
                : `<div class="muted">—</div>`;

            const attrsTable = d.attributes.length
                ? `
                <div class="attrs">
                    <details>
                        <summary>
                            Attributes <span class="pill">${d.attributes.length}</span>
                        </summary>
                        <div class="attrs-inner">
                            <table class="attrs-table">
                                <thead>
                                    <tr>
                                        <th>Attribute</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Definition</th>
                                        <th>Versions</th>
                                        <th>Limitations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${d.attributes
                                        .map(a => {
                                            const av = [
                                                a.addedInVersion
                                                    ? renderVersionBadge(
                                                          'added',
                                                          a.addedInVersion,
                                                          true,
                                                      )
                                                    : '',
                                                a.lastUpdatedInVersion
                                                    ? renderVersionBadge(
                                                          'updated',
                                                          a.lastUpdatedInVersion,
                                                          true,
                                                      )
                                                    : '',
                                                a.removedInVersion
                                                    ? renderVersionBadge(
                                                          'removed',
                                                          a.removedInVersion,
                                                          true,
                                                      )
                                                    : '',
                                            ]
                                                .filter(Boolean)
                                                .join('');

                                            const aChangelog = a.changelog
                                                ? `<div class="md md-compact">${mdToHtml(a.changelog)}</div>`
                                                : '';

                                            return `
                                        <tr>
                                            <td><code>${escapeHtml(a.name)}</code></td>
                                            <td><span class="badge badge-type">${escapeHtml(a.runtimeType)}</span></td>
                                            <td>${escapeHtml(a.description) || '<span class="muted">—</span>'}</td>
                                            <td>${escapeHtml(a.definition) || '<span class="muted">—</span>'}</td>
                                            <td>
                                                <div class="badge-row">${av || '<span class="muted">—</span>'}</div>
                                                ${aChangelog ? `<div class="sub">${aChangelog}</div>` : ''}
                                            </td>
                                            <td>${escapeHtml(a.limitations) || '<span class="muted">—</span>'}</td>
                                        </tr>
                                        `;
                                        })
                                        .join('\n')}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </div>
                `
                : `<div class="muted">No attributes</div>`;

            return `
            <article class="card"
                data-event-name="${escapeHtml(d.name).toLowerCase()}"
                data-event-key="${escapeHtml(d.key).toLowerCase()}"
                data-platform="${escapeHtml(platformsLabel)}"
                data-removed="${hasRemoved ? '1' : '0'}"
                data-added="${String(versionWeight(d.addedInVersion))}"
                data-updated="${String(versionWeight(d.lastUpdatedInVersion))}"
            >
                <header class="card-header">
                    <div class="title-row">
                        <div>
                            <div class="event-name">${escapeHtml(d.name)}</div>
                            <div class="event-key"><code>${escapeHtml(d.key)}</code></div>
                        </div>
                        <div class="badge-row">
                            ${platformBadges}
                            ${versionBadges}
                        </div>
                    </div>
                    <div class="desc">
                        ${escapeHtml(d.descriptionTrigger) || '<span class="muted">—</span>'}
                    </div>
                </header>

                <section class="grid">
                    <div class="box">
                        <div class="box-title">Changelog</div>
                        ${changelogHtml}
                    </div>

                    <div class="box">
                        <div class="box-title">Platforms</div>
                        <div class="badge-row">
                            ${platformBadges || '<span class="muted">—</span>'}
                        </div>
                    </div>
                </section>

                ${attrsTable}
            </article>`;
        })
        .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Analytics Events</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
:root{
  --bg:#f7f7f8;
  --card:#ffffff;
  --muted:#6b7280;
  --text:#111827;
  --border:#e5e7eb;
  --shadow: 0 1px 3px rgba(15,23,42,0.08);
  --shadow2: 0 8px 24px rgba(15,23,42,0.08);

  --blue-bg:#eff6ff; --blue:#1d4ed8; --blue-br:#bfdbfe;
  --green-bg:#ecfdf5; --green:#047857; --green-br:#a7f3d0;
  --amber-bg:#fffbeb; --amber:#b45309; --amber-br:#fde68a;
  --red-bg:#fef2f2; --red:#b91c1c; --red-br:#fecaca;

  --slate-bg:#f3f4f6; --slate:#374151; --slate-br:#d1d5db;
}

* { box-sizing: border-box; }
body{
  margin:24px;
  font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:var(--bg);
  color:var(--text);
}
h1{ margin:0 0 8px 0; font-size: 26px; }
small{ color: var(--muted); }

.topbar{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
  flex-wrap:wrap;
  margin: 14px 0 18px;
}
.controls{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  align-items:center;
}
.input, .select{
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 13px;
  min-width: 240px;
}
.select{ min-width: 180px; }
.input:focus, .select:focus{
  outline:none;
  border-color: var(--blue);
  box-shadow: 0 0 0 1px rgba(29,78,216,0.2);
}

.toggle{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:13px;
  color: var(--slate);
  user-select:none;
}
.toggle input{ transform: translateY(1px); }

.stats{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}
.stat{
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--slate);
}

.grid-cards{
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 14px;
}

.card{
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow:hidden;
}
.card-header{
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border);
}
.title-row{
  display:flex;
  gap:12px;
  justify-content:space-between;
  align-items:flex-start;
}
.event-name{ font-weight: 700; font-size: 16px; }
.event-key{ color: var(--muted); margin-top: 2px; font-size: 12px; }

.desc{
  margin-top: 10px;
  color: #374151;
  font-size: 13px;
  line-height: 1.4;
}

.box{
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  box-shadow: none;
}
.grid{
  display:grid;
  grid-template-columns: 1.4fr 0.6fr;
  gap: 12px;
  padding: 12px 16px;
}
.box-title{
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.badge-row{
  display:flex;
  gap:6px;
  flex-wrap:wrap;
  justify-content:flex-end;
}
.badge{
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1;
  border: 1px solid transparent;
  white-space: nowrap;
}
.badge-platform{
  background: var(--slate-bg);
  color: var(--slate);
  border-color: var(--slate-br);
}
.badge-type{
  background: var(--slate-bg);
  color: var(--slate);
  border-color: var(--slate-br);
}
.badge-added{
  background: var(--green-bg);
  color: var(--green);
  border-color: var(--green-br);
}
.badge-updated{
  background: var(--blue-bg);
  color: var(--blue);
  border-color: var(--blue-br);
}
.badge-removed{
  background: var(--red-bg);
  color: var(--red);
  border-color: var(--red-br);
}

.pill{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-width: 22px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--slate-bg);
  color: var(--slate);
  border: 1px solid var(--slate-br);
  font-size: 11px;
}

.attrs{
  padding: 0 16px 16px;
}
details{
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow:hidden;
  background:#fff;
}
summary{
  cursor:pointer;
  padding: 10px 12px;
  font-weight: 600;
  display:flex;
  justify-content:space-between;
  align-items:center;
  user-select:none;
  background: #fafafa;
  border-bottom: 1px solid var(--border);
}
.attrs-inner{ padding: 10px 12px; overflow:auto; }

.attrs-table{
  width:100%;
  border-collapse: collapse;
  font-size: 13px;
}
.attrs-table th, .attrs-table td{
  border-bottom: 1px solid var(--border);
  padding: 8px 8px;
  vertical-align: top;
}
.attrs-table th{
  text-align:left;
  color: var(--muted);
  font-weight: 600;
  font-size: 12px;
  white-space:nowrap;
}
.sub{
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
}
.muted{ color: var(--muted); }
code{
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 1px 5px;
  border-radius: 6px;
  font-size: 12px;
}

/* markdown rendering */
.md p{ margin: 0 0 8px 0; }
.md ul{ margin: 0 0 8px 18px; padding:0; }
.md h4, .md h5, .md h6{ margin: 10px 0 6px 0; }
.md a{ color: var(--blue); text-decoration: none; }
.md a:hover{ text-decoration: underline; }
.md-compact p{ margin: 0 0 6px 0; }
.md-compact ul{ margin-bottom: 6px; }

@media (max-width: 720px){
  .grid{ grid-template-columns: 1fr; }
  .badge-row{ justify-content:flex-start; }
  .grid-cards{ grid-template-columns: 1fr; }
  .input{ min-width: 100%; }
  .select{ min-width: 100%; }
}
</style>
</head>
<body>
  <h1>Analytics events</h1>
  <small>Generated: ${escapeHtml(now)}</small>

  <div class="topbar">
    <div class="controls">
      <input id="q" class="input" placeholder="Search by event name, key, description…" />
      <select id="platform" class="select">
        <option value="all">All platforms</option>
        <option value="desktop">Desktop</option>
        <option value="mobile">Mobile</option>
        <option value="both">Both</option>
      </select>
      <label class="toggle">
        <input id="showRemoved" type="checkbox" />
        Show removed
      </label>
      <select id="sort" class="select">
        <option value="name">Sort: name</option>
        <option value="added">Sort: added in</option>
        <option value="updated">Sort: last updated</option>
      </select>
    </div>

    <div class="stats">
      <div class="stat" id="statVisible"></div>
      <div class="stat">${docs.length} total</div>
    </div>
  </div>

  <section class="grid-cards" id="cards">
    ${eventCardsHtml}
  </section>

<script>
(function(){
  const q = document.getElementById('q');
  const platform = document.getElementById('platform');
  const showRemoved = document.getElementById('showRemoved');
  const sort = document.getElementById('sort');
  const cards = Array.from(document.querySelectorAll('.card'));
  const statVisible = document.getElementById('statVisible');

  function platformOf(card){
    return card.getAttribute('data-platform') || '—';
  }
  function matchesPlatform(card, selected){
    if (selected === 'all') return true;
    const p = platformOf(card);
    return p === selected;
  }
  function matchesQuery(card, query){
    if (!query) return true;
    const n = card.getAttribute('data-event-name') || '';
    const k = card.getAttribute('data-event-key') || '';
    const text = (card.innerText || '').toLowerCase();
    return n.includes(query) || k.includes(query) || text.includes(query);
  }
  function matchesRemoved(card, allowRemoved){
    if (allowRemoved) return true;
    return (card.getAttribute('data-removed') || '0') !== '1';
  }

  function apply(){
    const query = (q.value || '').trim().toLowerCase();
    const p = platform.value;
    const allowRemoved = showRemoved.checked;

    let visible = 0;
    for (const card of cards){
      const ok = matchesPlatform(card, p) && matchesQuery(card, query) && matchesRemoved(card, allowRemoved);
      card.style.display = ok ? '' : 'none';
      if (ok) visible++;
    }
    statVisible.textContent = visible + ' visible';
  }

  function applySort(){
    const mode = sort.value;
    const container = document.getElementById('cards');
    const sorted = cards.slice().sort((a,b)=>{
      if (mode === 'added'){
        return (Number(b.getAttribute('data-added')||'0') - Number(a.getAttribute('data-added')||'0'));
      }
      if (mode === 'updated'){
        return (Number(b.getAttribute('data-updated')||'0') - Number(a.getAttribute('data-updated')||'0'));
      }
      // name
      return (a.getAttribute('data-event-name')||'').localeCompare(b.getAttribute('data-event-name')||'');
    });
    for (const el of sorted) container.appendChild(el);
  }

  q.addEventListener('input', apply);
  platform.addEventListener('change', apply);
  showRemoved.addEventListener('change', apply);
  sort.addEventListener('change', ()=>{ applySort(); apply(); });

  applySort();
  apply();
})();
</script>

</body>
</html>`;

    return html;
}

function renderVersionBadge(
    kind: 'added' | 'updated' | 'removed',
    version: string,
    compact = false,
) {
    const cls =
        kind === 'added' ? 'badge-added' : kind === 'updated' ? 'badge-updated' : 'badge-removed';

    const label =
        kind === 'added'
            ? compact
                ? 'add'
                : 'added'
            : kind === 'updated'
              ? compact
                  ? 'upd'
                  : 'updated'
              : compact
                ? 'rm'
                : 'removed';

    return `<span class="badge ${cls}">${label} <code>${escapeHtml(version)}</code></span>`;
}

function main() {
    const html = renderHtml();
    const outPath = path.resolve(process.cwd(), 'analytics-events.html');

    writeFileSync(outPath, html, 'utf8');
    // eslint-disable-next-line no-console
    console.log('Analytics docs written to', outPath);
}

main();
