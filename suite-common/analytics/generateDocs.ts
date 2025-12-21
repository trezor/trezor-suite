// suite-common/analytics/generateDocs.ts
//
// Pretty HTML docs for analytics events.
// - merge desktop/mobile/shared exports into a single events map
// - attach `platforms` array to each event so HTML shows platform categorization
// - render a readable documentation (cards, grouped attributes, badges, markdown changelog)
//
// Monorepo layout (refactor):
// - Desktop events: @trezor/suite-analytics (packages/suite-analytics)
// - Mobile + Shared events: @suite-native/analytics (suite-native/analytics)
// - This script lives in the “main” package and is executed from repo root.
//
// Notes:
// - `changelog` in event defs is commonly `Array<{version, notes}>` (not a string).
//   We normalize it into markdown and also derive added/updated/removed versions.
// - This script is dependency-free (no markdown lib).
//
// Output: analytics-events.html in repo root.

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type Platform = 'desktop' | 'mobile';

type AnyEvent = {
    name?: string;
    descriptionTrigger?: string;
    attributes?: Record<string, any>;

    // In defs, changelog is commonly an array, not string:
    changelog?: unknown;

    // Some defs may also store these directly (not guaranteed):
    addedInVersion?: string;
    lastUpdatedInVersion?: string;
    removedInVersion?: string;

    // derived
    platforms?: Platform[];
};

type AnalyticsEventsModule = {
    desktopEvents?: Record<string, AnyEvent>;
    mobileEvents?: Record<string, AnyEvent>;
    sharedEvents?: Record<string, AnyEvent>;
};

type CombinedEvent = AnyEvent & {
    key: string;
    platforms: Platform[];
};

type AttrDoc = {
    name: string;
    runtimeType: string;
    definition?: string;
    description?: string;
    limitations?: string;
    addedInVersion?: string;
    lastUpdatedInVersion?: string;
    removedInVersion?: string;
    changelog?: string; // markdown (normalized)
};

type EventDoc = {
    key: string;
    name: string;
    descriptionTrigger?: string;
    platforms: Platform[];
    addedInVersion?: string;
    lastUpdatedInVersion?: string;
    removedInVersion?: string;
    changelog?: string; // markdown (normalized)
    attributes: AttrDoc[];
};

// --------------------------
// Dynamic importing helpers
// --------------------------

async function importMaybe(specifiers: string[]): Promise<AnalyticsEventsModule | null> {
    for (const spec of specifiers) {
        try {
            const mod = (await import(spec)) as any;

            return mod as AnalyticsEventsModule;
        } catch {
            // try next
        }
    }

    return null;
}

async function importFromRepoRelative(relPathFromRepoRoot: string): Promise<any | null> {
    try {
        const abs = path.resolve(process.cwd(), relPathFromRepoRoot);
        const url = pathToFileURL(abs).href;
        const mod = (await import(url)) as any;

        return mod;
    } catch {
        return null;
    }
}

async function loadAllEvents(): Promise<{
    desktop: Record<string, AnyEvent>;
    mobile: Record<string, AnyEvent>;
    shared: Record<string, AnyEvent>;
}> {
    // Prefer package imports (if exports are configured)
    const desktopPkg =
        (await importMaybe([
            '@trezor/suite-analytics/analyticsEvents',
            '@trezor/suite-analytics/dist/analyticsEvents',
            '@trezor/suite-analytics/src/analyticsEvents', // deep import fallback if allowed
            '@trezor/suite-analytics', // last resort if it re-exports maps
        ])) ?? null;

    const nativePkg =
        (await importMaybe([
            '@suite-native/analytics/analyticsEvents',
            '@suite-native/analytics/dist/analyticsEvents',
            '@suite-native/analytics/src/analyticsEvents', // deep import fallback if allowed
            '@suite-native/analytics',
        ])) ?? null;

    // Fallback to monorepo-relative paths (run from repo root)
    const desktopFallback =
        desktopPkg ??
        ((await importFromRepoRelative(
            'packages/suite-analytics/src/analyticsEvents.ts',
        )) as AnalyticsEventsModule | null);

    const nativeFallback =
        nativePkg ??
        ((await importFromRepoRelative(
            'suite-native/analytics/src/analyticsEvents.ts',
        )) as AnalyticsEventsModule | null);

    const desktopEvents = desktopFallback?.desktopEvents ?? {};
    const mobileEvents = nativeFallback?.mobileEvents ?? {};

    // shared exists in both; prefer native if present, else desktop
    const sharedEvents = nativeFallback?.sharedEvents ?? desktopFallback?.sharedEvents ?? {};

    return { desktop: desktopEvents, mobile: mobileEvents, shared: sharedEvents };
}

// --------------------------
// Merge logic
// --------------------------

const combinedEvents: Record<string, CombinedEvent> = {};

function stableStringify(x: unknown): string {
    try {
        const sortKeys = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(sortKeys);
            const out: any = {};
            for (const k of Object.keys(obj).sort()) out[k] = sortKeys(obj[k]);

            return out;
        };

        return JSON.stringify(sortKeys(x as any));
    } catch {
        return String(x);
    }
}

function shallowEventSignature(ev: AnyEvent): string {
    return stableStringify({
        name: ev?.name,
        descriptionTrigger: ev?.descriptionTrigger,
        attributes: ev?.attributes ? Object.keys(ev.attributes).sort() : [],
    });
}

function addEvent(
    key: string,
    ev: AnyEvent | undefined,
    platforms: Platform[],
    sourceLabel: string,
) {
    if (!ev) return;

    if (!combinedEvents[key]) {
        combinedEvents[key] = {
            key,
            ...ev,
            platforms: Array.from(new Set(platforms)),
        };

        return;
    }

    const existing = combinedEvents[key];
    existing.platforms = Array.from(new Set([...(existing.platforms ?? []), ...platforms]));

    // collision detection (same export key but different shape)
    const a = shallowEventSignature(existing);
    const b = shallowEventSignature(ev);

    if (a !== b) {
        console.warn(
            `[analytics-docs] Event key collision: "${key}" differs between sources.\n` +
                `- existing platforms: ${existing.platforms.join(', ')}\n` +
                `- new source: ${sourceLabel}\n` +
                `- existing signature: ${a}\n` +
                `- new signature:      ${b}\n`,
        );
    }
}

// --------------------------
// Changelog normalization
// --------------------------

type ChangelogItem = { version?: string; notes?: string };

function normStr(x: unknown): string {
    // eslint-disable-next-line no-nested-ternary
    return typeof x === 'string' ? x : x == null ? '' : String(x);
}

/** Convert changelog (string | array | object) into markdown string. */
function changelogToMarkdown(input: unknown): string {
    if (input == null) return '';

    if (typeof input === 'string') return input;

    if (Array.isArray(input)) {
        // array of strings?
        if (input.every(x => typeof x === 'string')) return (input as string[]).join('\n');

        // array of objects: [{version, notes}, ...]
        const items = input as ChangelogItem[];

        return items
            .map(i => {
                const v = i?.version ? `**${normStr(i.version)}**` : '**—**';
                const n = i?.notes ? normStr(i.notes) : '';

                return `- ${v}${n ? `: ${n}` : ''}`;
            })
            .join('\n');
    }

    // fallback stringify for weird shapes
    try {
        return JSON.stringify(input, null, 2);
    } catch {
        return String(input);
    }
}

/**
 * Extract added/updated/removed versions from a changelog array.
 * If changelog is not an array, we only return markdown.
 */
function versionsFromChangelog(input: unknown): {
    addedInVersion?: string;
    lastUpdatedInVersion?: string;
    removedInVersion?: string;
    changelogMarkdown?: string;
} {
    const changelogMarkdown = changelogToMarkdown(input);
    const items = Array.isArray(input) ? (input as ChangelogItem[]) : null;

    if (!items || items.length === 0) {
        return { changelogMarkdown };
    }

    const lower = (s?: string) => (s ?? '').toLowerCase();

    const added = items.find(i => lower(i.notes).includes('added'))?.version;
    const removed = items.find(i => lower(i.notes).includes('removed'))?.version;

    const updatedExplicit = [...items]
        .reverse()
        .find(i => lower(i.notes).includes('updated'))?.version;
    const updatedFallback = items.length > 1 ? items[items.length - 1]?.version : undefined;

    return {
        addedInVersion: added,
        lastUpdatedInVersion: updatedExplicit ?? updatedFallback,
        removedInVersion: removed,
        changelogMarkdown,
    };
}

// --------------------------
// HTML helpers
// --------------------------

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
 *
 * NOTE: `md` can be unknown; we normalize changelog arrays into markdown first.
 */
function mdToHtml(md?: unknown): string {
    const src = changelogToMarkdown(md).trim();
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

// --------------------------
// Build docs
// --------------------------

function buildDocs(events: Record<string, CombinedEvent>): EventDoc[] {
    const docs: EventDoc[] = [];

    for (const [eventKey, event] of Object.entries(events ?? {})) {
        const platforms: Platform[] = Array.isArray((event as any).platforms)
            ? ((event as any).platforms as Platform[])
            : [];

        const evVersionFromChangelog = versionsFromChangelog((event as any).changelog);

        // If defs sometimes carry versions directly, prefer direct fields, else derived.
        const addedInVersion =
            (event as any).addedInVersion ?? evVersionFromChangelog.addedInVersion;
        const lastUpdatedInVersion =
            (event as any).lastUpdatedInVersion ?? evVersionFromChangelog.lastUpdatedInVersion;
        const removedInVersion =
            (event as any).removedInVersion ?? evVersionFromChangelog.removedInVersion;

        const attrs = event.attributes ? Object.entries(event.attributes) : [];

        const attrDocs: AttrDoc[] = attrs
            .filter(([, a]) => !!a)
            .map(([attrName, attr]) => {
                const runtimeType = typeof (attr as any).value;

                const aVer = versionsFromChangelog((attr as any).changelog);

                return {
                    name: attrName,
                    runtimeType,
                    definition: (attr as any).definition,
                    description: (attr as any).description,
                    limitations: (attr as any).limitations,
                    addedInVersion: (attr as any).addedInVersion ?? aVer.addedInVersion,
                    lastUpdatedInVersion:
                        (attr as any).lastUpdatedInVersion ?? aVer.lastUpdatedInVersion,
                    removedInVersion: (attr as any).removedInVersion ?? aVer.removedInVersion,
                    changelog: aVer.changelogMarkdown,
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        docs.push({
            key: eventKey,
            name: String((event as any).name),
            descriptionTrigger: (event as any).descriptionTrigger,
            platforms,
            addedInVersion,
            lastUpdatedInVersion,
            removedInVersion,
            changelog: evVersionFromChangelog.changelogMarkdown,
            attributes: attrDocs,
        });
    }

    // default sort: name
    docs.sort((a, b) => a.name.localeCompare(b.name));

    return docs;
}

// --------------------------
// Render HTML (same “nice” UI as your original)
// --------------------------

function renderVersionBadge(
    kind: 'added' | 'updated' | 'removed',
    version: string,
    compact = false,
) {
    const cls =
        // eslint-disable-next-line no-nested-ternary
        kind === 'added' ? 'badge-added' : kind === 'updated' ? 'badge-updated' : 'badge-removed';

    const label =
        // eslint-disable-next-line no-nested-ternary
        kind === 'added'
            ? compact
                ? 'add'
                : 'added'
            : // eslint-disable-next-line no-nested-ternary
              kind === 'updated'
              ? compact
                  ? 'upd'
                  : 'updated'
              : compact
                ? 'rm'
                : 'removed';

    return `<span class="badge ${cls}">${label} <code>${escapeHtml(version)}</code></span>`;
}

function renderHtml(): string {
    const docs = buildDocs(combinedEvents);
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
  --bg:#0b0f19;
  --card:#0f172a;
  --muted:#94a3b8;
  --text:#e5e7eb;
  --border:#1f2937;

  --shadow: 0 1px 3px rgba(0,0,0,0.45);
  --shadow2: 0 8px 24px rgba(0,0,0,0.45);

  --blue-bg: rgba(59,130,246,0.12); --blue:#60a5fa; --blue-br: rgba(96,165,250,0.35);
  --green-bg: rgba(16,185,129,0.12); --green:#34d399; --green-br: rgba(52,211,153,0.35);
  --amber-bg: rgba(245,158,11,0.12); --amber:#fbbf24; --amber-br: rgba(251,191,36,0.35);
  --red-bg: rgba(239,68,68,0.12); --red:#f87171; --red-br: rgba(248,113,113,0.35);

  --slate-bg: rgba(148,163,184,0.10); --slate:#cbd5e1; --slate-br: rgba(148,163,184,0.25);

  --input-bg:#0b1220;
  --input-text:#e5e7eb;
  --input-placeholder:#64748b;
  --focus: rgba(96,165,250,0.35);
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
  background: var(--input-bg);
  color: var(--input-text);
  font-size: 13px;
  min-width: 240px;
}
.input::placeholder{
  color: var(--input-placeholder);
}
.select{ min-width: 180px; }
.input:focus, .select:focus{
  outline:none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--focus);
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
  background: rgba(15,23,42,0.55);
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
  background: rgba(15,23,42,0.78);
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
.event-name{ font-weight: 700; font-size: 16px; color: var(--text); }
.event-key{ color: var(--muted); margin-top: 2px; font-size: 12px; }

.desc{
  margin-top: 10px;
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.4;
}

.box{
  background: rgba(2,6,23,0.35);
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
  background: rgba(15,23,42,0.55);
}
summary{
  cursor:pointer;
  padding: 10px 12px;
  font-weight: 600;
  display:flex;
  justify-content:space-between;
  align-items:center;
  user-select:none;
  background: rgba(2,6,23,0.35);
  border-bottom: 1px solid var(--border);
}
.attrs-inner{ padding: 10px 12px; overflow:auto; }

.attrs-table{
  width:100%;
  border-collapse: collapse;
  font-size: 13px;
}
.attrs-table th, .attrs-table td{
  border-bottom: 1px solid rgba(31,41,55,0.9);
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
  background: rgba(148,163,184,0.10);
  border: 1px solid rgba(148,163,184,0.22);
  padding: 1px 5px;
  border-radius: 6px;
  font-size: 12px;
  color: #e2e8f0;
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

// --------------------------
// Main
// --------------------------

async function main() {
    const { desktop, mobile, shared } = await loadAllEvents();

    for (const [k, v] of Object.entries(desktop)) addEvent(k, v, ['desktop'], 'desktop');
    for (const [k, v] of Object.entries(mobile)) addEvent(k, v, ['mobile'], 'mobile');
    for (const [k, v] of Object.entries(shared)) addEvent(k, v, ['desktop', 'mobile'], 'shared');

    if (!combinedEvents || Object.keys(combinedEvents).length === 0) {
        console.warn(
            '[analytics-docs] No analytics events found (desktop/mobile/shared maps are empty).',
        );
    }

    const html = renderHtml();
    const outPath = path.resolve(process.cwd(), 'analytics-events.html');

    writeFileSync(outPath, html, 'utf8');
    // eslint-disable-next-line no-console
    console.log('Analytics docs written to', outPath);
}

void main();
