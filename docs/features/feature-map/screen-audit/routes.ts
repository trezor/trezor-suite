// Route completeness check: every registered mobile route and every desktop/web route, joined with
// the screen-audit ledgers, runtime screenshots and replayable capture flows.
//
//   node docs/features/feature-map/screen-audit/routes.ts          # write route-coverage.{json,md}
//   node docs/features/feature-map/screen-audit/routes.ts --check  # exit 1 when the files are stale
//
// Source is parsed as TypeScript text (no compiler dependency). Anything the parser cannot resolve is
// listed under `unresolved` instead of being dropped.

import * as fs from 'node:fs';
import * as nodePath from 'node:path';

import { isMain, pyCompareStrings, pyJsonDumps, readText } from '../pylib.ts';

const HERE = import.meta.dirname;
const CATALOG = nodePath.dirname(HERE);
const REPO = nodePath.dirname(nodePath.dirname(nodePath.dirname(CATALOG)));
const JSON_OUT = nodePath.join(HERE, 'route-coverage.json');
const MD_OUT = nodePath.join(HERE, 'route-coverage.md');

const MOBILE_ROUTES_FILE = 'suite-native/navigation/src/routes.ts';
const MOBILE_ROOTS = ['suite-native', 'suite-native-app'];
const DESKTOP_ROUTE_CONFIG = 'suite/router-config/src/routeConfig.ts';
const DESKTOP_COMPONENTS = 'suite-app/desktop-app-renderer/src/support/desktopComponents.ts';
const WEB_COMPONENTS = 'suite-app/web-app/src/support/webComponents.ts';
const APP_ROUTER = 'suite-app/app/src/AppRouter/AppRouter.tsx';
const FOREGROUND_APP_MODAL = 'suite-app/app/src/ModalSwitcher/ForegroundAppModal.tsx';
const PRELOADER = 'suite-app/app/src/Preloader/Preloader.tsx';
const WORKSPACE_ROOTS = [
    'packages',
    'suite',
    'suite-app',
    'suite-common',
    'suite-native',
    'suite-native-app',
];
const MAX_INCOMING_FILES = 10;

// Internal rules (documented in route-coverage.md): a ledger disposition marking the screen as
// internal, or a route/enum member name that is a development surface.
const INTERNAL_DISPOSITIONS = new Set(['excluded-internal', 'internal-reference']);
const MOBILE_INTERNAL_NAME = /DevUtils|MessageSystem|AppsEmbedding|Storybook|Debug/;
const DESKTOP_INTERNAL_NAME = /debug|embedding|storybook/;

type Obj = Record<string, unknown>;

const cmp = (a: string, b: string) => pyCompareStrings(a, b);
const sortStrings = (items: Iterable<string>): string[] => [...new Set(items)].sort(cmp);

const matchResult = (count: number): string => {
    if (count === 1) return 'unique';

    return count ? 'ambiguous' : 'no-match';
};
const rel = (abs: string) => nodePath.relative(REPO, abs).split(nodePath.sep).join('/');
const abs = (repoPath: string) => nodePath.join(REPO, repoPath);
const isFile = (p: string) => {
    try {
        return fs.statSync(p).isFile();
    } catch {
        return false;
    }
};

const SYSTEM_ALERT = 'system-alert';

const isObj = (value: unknown): value is Obj =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const asObj = (value: unknown, where: string): Obj => {
    if (!isObj(value)) throw new Error(`${where}: expected an object`);

    return value;
};

const asArray = (value: unknown, where: string): unknown[] => {
    if (!Array.isArray(value)) throw new Error(`${where}: expected an array`);

    return value;
};

const asStr = (value: unknown, where: string): string => {
    if (typeof value !== 'string') throw new Error(`${where}: expected a string`);

    return value;
};

const asStrArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const readJsonFile = (p: string): unknown => JSON.parse(fs.readFileSync(p, 'utf8'));

// ---------------------------------------------------------------------------
// Source text helpers
// ---------------------------------------------------------------------------

/** Replace comments with spaces, keeping offsets and string/template literals intact. */
export const stripComments = (text: string): string => {
    const out = text.split('');
    let i = 0;
    const n = text.length;
    while (i < n) {
        const c = text[i];
        if (c === '/' && text[i + 1] === '/') {
            while (i < n && text[i] !== '\n') out[i++] = ' ';
        } else if (c === '/' && text[i + 1] === '*') {
            while (i < n && !(text[i] === '*' && text[i + 1] === '/')) {
                if (text[i] !== '\n') out[i] = ' ';
                i++;
            }
            if (i < n) {
                out[i] = ' ';
                out[i + 1] = ' ';
                i += 2;
            }
        } else if (c === "'" || c === '"' || c === '`') {
            i++;
            while (i < n && text[i] !== c) {
                if (text[i] === '\\') i++;
                i++;
            }
            i++;
        } else {
            i++;
        }
    }

    return out.join('');
};

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

/** Index just past the balanced bracket that closes the one at `start`. */
const skipBalanced = (text: string, start: number): number => {
    const open = text[start];
    let close = ']';
    if (open === '{') close = '}';
    else if (open === '(') close = ')';
    let depth = 0;
    let i = start;
    while (i < text.length) {
        const c = text[i];
        if (c === "'" || c === '"' || c === '`') {
            i++;
            while (i < text.length && text[i] !== c) {
                if (text[i] === '\\') i++;
                i++;
            }
        } else if (c === open) depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) return i + 1;
        }
        i++;
    }

    return text.length;
};

type JsxTag = {
    attrs: Record<string, string>;
    children: string | null;
    start: number;
    end: number;
};

/** Parse the JSX element whose `<Tag` starts at `start` (attributes may span lines). */
const parseJsxElement = (text: string, start: number, tag: string): JsxTag => {
    const attrs: Record<string, string> = {};
    let i = start + 1 + tag.length;
    let selfClosing = false;
    while (i < text.length) {
        while (/\s/.test(text[i])) i++;
        if (text.startsWith('/>', i)) {
            selfClosing = true;
            i += 2;
            break;
        }
        if (text[i] === '>') {
            i++;
            break;
        }
        if (text[i] === '{') {
            // spread attributes: {...props}
            const end = skipBalanced(text, i);
            attrs[`...${Object.keys(attrs).length}`] = text.slice(i + 1, end - 1).trim();
            i = end;
            continue;
        }
        const name = /^[\w:-]+/.exec(text.slice(i))?.[0];
        if (!name) {
            i++;
            continue;
        }
        i += name.length;
        while (/\s/.test(text[i])) i++;
        if (text[i] !== '=') {
            attrs[name] = 'true';
            continue;
        }
        i++;
        while (/\s/.test(text[i])) i++;
        if (text[i] === '{') {
            const end = skipBalanced(text, i);
            attrs[name] = text.slice(i + 1, end - 1).trim();
            i = end;
        } else if (text[i] === '"' || text[i] === "'") {
            const q = text[i];
            const end = text.indexOf(q, i + 1);
            attrs[name] = text.slice(i, end + 1);
            i = end + 1;
        }
    }
    if (selfClosing) return { attrs, children: null, start, end: i };
    const closing = `</${tag}>`;
    const closeAt = text.indexOf(closing, i);
    const endAt = closeAt < 0 ? text.length : closeAt;

    return {
        attrs,
        children: text.slice(i, endAt),
        start,
        end: closeAt < 0 ? endAt : endAt + closing.length,
    };
};

/** True when the element is rendered behind `cond && (...)` or a ternary branch. */
const isConditional = (text: string, start: number): boolean => {
    let j = start - 1;
    while (j >= 0 && /\s/.test(text[j])) j--;
    if (text[j] === '(') {
        j--;
        while (j >= 0 && /\s/.test(text[j])) j--;
    }

    return text.slice(Math.max(0, j - 1), j + 1) === '&&' || text[j] === '?' || text[j] === ':';
};

// ---------------------------------------------------------------------------
// Module resolution (relative files and workspace packages)
// ---------------------------------------------------------------------------

type Workspace = { dir: string; entries: Map<string, string> };
let workspaceCache: Map<string, Workspace> | null = null;

const workspaces = (): Map<string, Workspace> => {
    if (workspaceCache) return workspaceCache;
    const map = new Map<string, Workspace>();
    const visit = (dir: string, depth: number) => {
        const pkg = nodePath.join(dir, 'package.json');
        if (isFile(pkg)) {
            const rawPkg = readJsonFile(pkg);
            if (isObj(rawPkg) && typeof rawPkg.name === 'string') {
                const entries = new Map<string, string>();
                const exp = rawPkg.exports;
                const target = (value: unknown): string | null => {
                    if (typeof value === 'string') return value;
                    if (isObj(value)) {
                        return target(value.default ?? value.import ?? value.require ?? null);
                    }

                    return null;
                };
                if (isObj(exp)) {
                    for (const [key, value] of Object.entries(exp)) {
                        const t = target(value);
                        if (t) entries.set(key, t);
                    }
                } else if (typeof exp === 'string') entries.set('.', exp);
                if (!entries.has('.'))
                    entries.set('.', typeof rawPkg.main === 'string' ? rawPkg.main : 'src/index');
                map.set(rawPkg.name, { dir, entries });
            }
        }
        if (depth === 0) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.'))
                visit(nodePath.join(dir, entry.name), depth - 1);
        }
    };
    for (const root of WORKSPACE_ROOTS) {
        const dir = abs(root);
        if (fs.existsSync(dir)) visit(dir, 2);
    }
    workspaceCache = map;

    return map;
};

const tryFile = (base: string): string | null => {
    for (const candidate of [
        base,
        `${base}.tsx`,
        `${base}.ts`,
        nodePath.join(base, 'index.tsx'),
        nodePath.join(base, 'index.ts'),
    ]) {
        if (isFile(candidate)) return candidate;
    }

    return null;
};

const resolveModule = (fromFile: string, spec: string): string | null => {
    if (spec.startsWith('.')) return tryFile(nodePath.resolve(nodePath.dirname(fromFile), spec));
    const parts = spec.split('/');
    const nameLength = spec.startsWith('@') ? 2 : 1;
    const name = parts.slice(0, nameLength).join('/');
    const sub = parts.slice(nameLength).join('/');
    const ws = workspaces().get(name);
    if (!ws) return null;
    const key = sub ? `./${sub}` : '.';
    const direct = ws.entries.get(key);
    if (direct) return tryFile(nodePath.join(ws.dir, direct));
    for (const [pattern, target] of ws.entries) {
        const starIndex = pattern.indexOf('*');
        if (starIndex < 0) continue;
        const prefix = pattern.slice(0, starIndex);
        const suffix = pattern.slice(starIndex + 1);
        if (
            key.length >= prefix.length + suffix.length &&
            key.startsWith(prefix) &&
            key.endsWith(suffix)
        ) {
            const star = key.slice(prefix.length, key.length - suffix.length);

            return tryFile(nodePath.join(ws.dir, target.split('*').join(star)));
        }
    }

    return tryFile(nodePath.join(ws.dir, sub));
};

type Binding = { imported: string; spec: string };
type ModuleInfo = {
    text: string;
    imports: Map<string, Binding>;
    reexports: Map<string, Binding>;
    localExports: Map<string, string>;
    starExports: string[];
    declarations: Set<string>;
};
const moduleCache = new Map<string, ModuleInfo>();

const parseSpecifiers = (body: string): [string, string][] =>
    body
        .split(',')
        .map(s => s.trim().replace(/^type\s+/, ''))
        .filter(Boolean)
        .map(s => {
            const m = /^([\w$]+)(?:\s+as\s+([\w$]+))?$/.exec(s);

            return m ? ([m[1], m[2] ?? m[1]] as [string, string]) : null;
        })
        .filter((x): x is [string, string] => x !== null);

const moduleInfo = (file: string): ModuleInfo => {
    const cached = moduleCache.get(file);
    if (cached) return cached;
    const text = stripComments(fs.readFileSync(file, 'utf8'));
    const imports = new Map<string, Binding>();
    const reexports = new Map<string, Binding>();
    const localExports = new Map<string, string>();
    const starExports: string[] = [];
    const declarations = new Set<string>();
    for (const m of text.matchAll(
        /\bimport\s+(?:type\s+)?([\w$]+)?\s*,?\s*(?:\{([^}]*)\})?\s*from\s*['"]([^'"]+)['"]/g,
    )) {
        if (m[1]) imports.set(m[1], { imported: 'default', spec: m[3] });
        for (const [imported, local] of parseSpecifiers(m[2] ?? ''))
            imports.set(local, { imported, spec: m[3] });
    }
    for (const m of text.matchAll(
        /\bexport\s+(?:type\s+)?\{([^}]*)\}\s*(?:from\s*['"]([^'"]+)['"])?/g,
    )) {
        for (const [inner, outer] of parseSpecifiers(m[1])) {
            if (m[2]) reexports.set(outer, { imported: inner, spec: m[2] });
            else localExports.set(outer, inner);
        }
    }
    for (const m of text.matchAll(/\bexport\s+\*\s+from\s*['"]([^'"]+)['"]/g))
        starExports.push(m[1]);
    for (const m of text.matchAll(/\b(?:const|let|var|function\*?|class)\s+([\w$]+)/g))
        declarations.add(m[1]);
    const info = { text, imports, reexports, localExports, starExports, declarations };
    moduleCache.set(file, info);

    return info;
};

/** File that defines `symbol` as seen from `file` (follows imports and re-exports). */
const resolveSymbol = (
    file: string,
    symbol: string,
    depth = 0,
    seen = new Set<string>(),
): string | null => {
    const key = `${file}#${symbol}`;
    if (depth > 12 || seen.has(key)) return null;
    seen.add(key);
    const info = moduleInfo(file);
    if (info.declarations.has(symbol)) return file;
    const local = info.localExports.get(symbol);
    if (local && local !== symbol) return resolveSymbol(file, local, depth + 1, seen);
    for (const binding of [info.imports.get(symbol), info.reexports.get(symbol)]) {
        if (!binding) continue;
        const target = resolveModule(file, binding.spec);
        if (!target) return null;
        if (binding.imported === 'default') return target;

        return resolveSymbol(target, binding.imported, depth + 1, seen);
    }
    for (const spec of info.starExports) {
        const target = resolveModule(file, spec);
        if (!target) continue;
        const found = resolveSymbol(target, symbol, depth + 1, seen);
        if (found) return found;
    }

    return null;
};

// ---------------------------------------------------------------------------
// Inputs shared by both platforms
// ---------------------------------------------------------------------------

type Screenshot = { id: string; platform: string; features: string[] };
export type Flow = { screenshot_id: string; route: string; status: string };

const loadScreenshots = (): Screenshot[] => {
    const catalog = asObj(readJsonFile(nodePath.join(CATALOG, 'features.json')), 'features.json');
    const runtime = asObj(catalog.runtime, 'features.json.runtime');

    return asArray(runtime.screenshots, 'features.json.runtime.screenshots').map((item, index) => {
        const s = asObj(item, `features.json.runtime.screenshots[${index}]`);

        return {
            id: asStr(s.id, `features.json.runtime.screenshots[${index}].id`),
            platform: asStr(s.platform, `features.json.runtime.screenshots[${index}].platform`),
            features: asStrArray(s.effective_feature_ids ?? s.feature_ids),
        };
    });
};

/**
 * Fallback join for components without a ledger row: features whose implementation evidence is
 * the component file or, for an index file, a file in its directory.
 */
const loadEvidenceIndex = (): ((file: string | null) => string[]) => {
    const catalog = asObj(readJsonFile(nodePath.join(CATALOG, 'features.json')), 'features.json');
    const byPath = new Map<string, string[]>();
    for (const [index, rawFeature] of asArray(
        catalog.features,
        'features.json.features',
    ).entries()) {
        const feature = asObj(rawFeature, `features.json.features[${index}]`);
        const featureId = asStr(feature.id, `features.json.features[${index}].id`);
        const evidenceList = Array.isArray(feature.evidence) ? feature.evidence : [];
        for (const rawEvidence of evidenceList) {
            if (!isObj(rawEvidence)) continue;
            if (rawEvidence.kind !== 'implementation' || typeof rawEvidence.path !== 'string')
                continue;
            byPath.set(rawEvidence.path, [...(byPath.get(rawEvidence.path) ?? []), featureId]);
        }
    }

    return (file: string | null) => {
        if (!file) return [];
        const base = nodePath.posix.basename(file);
        const dir = `${nodePath.posix.dirname(file)}/`;
        const ids = [...byPath]
            .filter(
                ([path]) => path === file || (/^index\.tsx?$/.test(base) && path.startsWith(dir)),
            )
            .flatMap(([, pathIds]) => pathIds);

        return sortStrings([...new Set(ids)]);
    };
};

let evidenceFeatures: (file: string | null) => string[] = () => [];

const CAPTURE_FLOWS = nodePath.join(CATALOG, 'parts/capture-flows.json');

const loadFlows = (): { present: boolean; flows: Flow[] } => {
    if (!fs.existsSync(CAPTURE_FLOWS)) return { present: false, flows: [] };
    const data = asObj(readJsonFile(CAPTURE_FLOWS), 'capture-flows.json');
    const rawFlows = Array.isArray(data.flows) ? data.flows : [];

    return {
        present: true,
        flows: rawFlows.map((item, index) => {
            const f = asObj(item, `capture-flows.json.flows[${index}]`);
            const arrival = isObj(f.arrival) ? f.arrival : {};

            return {
                screenshot_id: asStr(
                    f.screenshot_id,
                    `capture-flows.json.flows[${index}].screenshot_id`,
                ),
                route: typeof arrival.route === 'string' ? arrival.route : '',
                status: asStr(f.status, `capture-flows.json.flows[${index}].status`),
            };
        }),
    };
};

type LedgerRow = {
    path: string;
    symbol: string;
    feature_ids: string[];
    disposition: string;
    registered_in: string[];
    ledger: string;
};

const loadLedger = (name: string): LedgerRow[] => {
    const data = asObj(readJsonFile(nodePath.join(HERE, `${name}.json`)), `${name}.json`);

    return asArray(data.screen_reviews, `${name}.json.screen_reviews`).map((item, index) => {
        const r = asObj(item, `${name}.json.screen_reviews[${index}]`);

        return {
            path: asStr(r.path, `${name}.json.screen_reviews[${index}].path`),
            symbol: typeof r.symbol === 'string' ? r.symbol : '',
            feature_ids: asStrArray(r.feature_ids),
            disposition: typeof r.disposition === 'string' ? r.disposition : '',
            registered_in: asStrArray(r.registered_in),
            ledger: name,
        };
    });
};

const screenshotsFor = (features: string[], shots: Screenshot[], platforms: string[]) => {
    const wanted = new Set(features);

    return shots
        .filter(s => platforms.includes(s.platform) && s.features.some(f => wanted.has(f)))
        .map(s => s.id);
};

type Unresolved = { platform: string; kind: string; detail: string; file: string; line?: number };

// ---------------------------------------------------------------------------
// Mobile
// ---------------------------------------------------------------------------

type EnumMember = { enumName: string; member: string; value: string; line: number };

const parseMobileEnums = (): EnumMember[] => {
    const text = stripComments(readText(abs(MOBILE_ROUTES_FILE)));
    const out: EnumMember[] = [];
    for (const m of text.matchAll(/export\s+enum\s+(\w+Routes)\s*\{/g)) {
        const bodyStart = (m.index ?? 0) + m[0].length - 1;
        const bodyEnd = skipBalanced(text, bodyStart);
        const body = text.slice(bodyStart + 1, bodyEnd - 1);
        for (const e of body.matchAll(/(\w+)\s*=\s*(['"`])(.*?)\2/g)) {
            out.push({
                enumName: m[1],
                member: e[1],
                value: e[3],
                line: lineOf(text, bodyStart + 1 + (e.index ?? 0)),
            });
        }
    }

    return out;
};

const walkSource = (roots: string[]): string[] => {
    const out: string[] = [];
    const visit = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
            const p = nodePath.join(dir, entry.name);
            if (entry.isDirectory()) visit(p);
            else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(p);
        }
    };
    for (const root of roots) visit(abs(root));

    return out.sort((a, b) => cmp(rel(a), rel(b)));
};

/** Test, story and E2E sources are not app navigation. */
const isNonAppSource = (repoPath: string) =>
    /(^|\/)(e2e|__tests__|__mocks__|storybook)\//.test(repoPath) ||
    /\.(test|spec|stories)\.tsx?$/.test(repoPath);

type Registration = {
    navigator: string;
    navigatorVar: string;
    line: number;
    nameExpr: string;
    routeKey: string | null;
    component: string | null;
    componentKind: 'component' | 'inline' | 'getComponent' | 'children' | 'unknown';
    componentFile: string | null;
    inlineRenders: string | null;
    conditional: boolean;
    isNavigator: boolean;
};

const parseRegistrations = (files: string[], unresolved: Unresolved[]): Registration[] => {
    const regs: Registration[] = [];
    for (const file of files) {
        const repoPath = rel(file);
        if (isNonAppSource(repoPath)) continue;
        const info = moduleInfo(file);
        const { text } = info;
        for (const m of text.matchAll(/<([A-Za-z_$][\w$]*)\.Screen\b/g)) {
            const tag = `${m[1]}.Screen`;
            const el = parseJsxElement(text, m.index ?? 0, tag);
            const line = lineOf(text, m.index ?? 0);
            const nameExpr = el.attrs.name ?? '';
            const nameMatch = /^([A-Z]\w*Routes)\.(\w+)$/.exec(nameExpr);
            let component: string | null = null;
            let kind: Registration['componentKind'] = 'unknown';
            if (el.attrs.component !== undefined) {
                const c = el.attrs.component;
                if (/^[\w$]+$/.test(c)) {
                    component = c;
                    kind = 'component';
                } else {
                    const inline = /^function\s+([\w$]+)/.exec(c);
                    component = inline ? inline[1] : null;
                    kind = 'inline';
                }
            } else if (el.attrs.getComponent !== undefined) {
                kind = 'getComponent';
                component = /\.([\w$]+)\s*\)?\s*$/.exec(el.attrs.getComponent)?.[1] ?? null;
            } else if (el.children !== null) {
                kind = 'children';
                component = /<([A-Z][\w$.]*)/.exec(el.children)?.[1] ?? null;
            }
            let componentFile: string | null = null;
            let inlineRenders: string | null = null;
            if (kind === 'inline') {
                // Inline function component: attribute it to the first element it renders.
                inlineRenders = /<([A-Z][\w$]*)/.exec(el.attrs.component)?.[1] ?? null;
                const resolved = inlineRenders ? resolveSymbol(file, inlineRenders) : null;
                componentFile = resolved ? rel(resolved) : repoPath;
            } else if (component) {
                const resolved = resolveSymbol(file, component.split('.')[0]);
                componentFile = resolved ? rel(resolved) : null;
            }
            if (!nameMatch)
                unresolved.push({
                    platform: 'mobile',
                    kind: 'non-enum-route-name',
                    detail: `${tag} name={${nameExpr}}`,
                    file: repoPath,
                    line,
                });
            if (!componentFile)
                unresolved.push({
                    platform: 'mobile',
                    kind: 'component-file-unresolved',
                    detail: `${tag} ${nameExpr} -> ${component ?? '(no component)'} (${kind})`,
                    file: repoPath,
                    line,
                });
            regs.push({
                navigator: repoPath,
                navigatorVar: m[1],
                line,
                nameExpr,
                routeKey: nameMatch ? `${nameMatch[1]}.${nameMatch[2]}` : null,
                component,
                componentKind: kind,
                componentFile,
                inlineRenders,
                conditional: isConditional(text, m.index ?? 0),
                isNavigator: false,
            });
        }
    }
    const navigatorFiles = new Set(regs.map(r => r.navigator));
    for (const r of regs)
        r.isNavigator =
            r.componentKind !== 'inline' &&
            !!r.componentFile &&
            navigatorFiles.has(r.componentFile);

    return regs;
};

type Edge = { target: string; file: string; kind: string };

const EDGE_PATTERNS: [string, RegExp][] = [
    [
        'call',
        /\b(?:navigate|push|replace|popTo|jumpTo|navigateTo\w*|navigateToRoute)\s*(?:<[^()]*?>)?\s*\(\s*([A-Z]\w*Routes)\.(\w+)/g,
    ],
    ['screen-param', /\bscreen\s*:\s*([A-Z]\w*Routes)\.(\w+)/g],
    ['route-object', /\b(?:name|routeName)\s*:\s*([A-Z]\w*Routes)\.(\w+)/g],
];

const parseEdges = (files: string[]): Edge[] => {
    const edges: Edge[] = [];
    for (const file of files) {
        const repoPath = rel(file);
        if (isNonAppSource(repoPath) || repoPath === MOBILE_ROUTES_FILE) continue;
        const { text } = moduleInfo(file);
        if (!/Routes\./.test(text)) continue;
        const direct = new Set<string>();
        for (const [kind, re] of EDGE_PATTERNS) {
            for (const m of text.matchAll(re)) {
                edges.push({ target: `${m[1]}.${m[2]}`, file: repoPath, kind });
                direct.add(`${m[1]}.${m[2]}`);
            }
        }
        // Other value references (route maps, helpers taking a route variable); computed type keys
        // (`[X.Y]: Params`) and JSX registrations (`name={X.Y}`) are not navigation.
        const indirect = new Set<string>();
        for (const m of text.matchAll(/\b([A-Z]\w*Routes)\.(\w+)\b/g)) {
            const before = text.slice(Math.max(0, (m.index ?? 0) - 6), m.index ?? 0);
            const after = text.slice(
                (m.index ?? 0) + m[0].length,
                (m.index ?? 0) + m[0].length + 3,
            );
            if (/\[\s*$/.test(before) && /^\s*\]/.test(after)) continue;
            if (/name=\{\s*$/.test(before)) continue;
            const key = `${m[1]}.${m[2]}`;
            if (!direct.has(key)) indirect.add(key);
        }
        for (const key of indirect) edges.push({ target: key, file: repoPath, kind: 'reference' });
    }

    return edges;
};

const statusFor = (features: string[], screenshots: string[]) => {
    if (!features.length) return 'unmapped';

    return screenshots.length ? 'covered' : 'features-only';
};

const buildMobile = (
    unresolved: Unresolved[],
    shots: Screenshot[],
    flows: Flow[],
    flowJoin: Obj[],
) => {
    const members = parseMobileEnums();
    const files = walkSource(MOBILE_ROOTS);
    const regs = parseRegistrations(files, unresolved);
    const edges = parseEdges(files);
    const ledger = loadLedger('mobile');
    const memberKeys = new Set(members.map(m => `${m.enumName}.${m.member}`));
    for (const r of regs) {
        if (r.routeKey && !memberKeys.has(r.routeKey))
            unresolved.push({
                platform: 'mobile',
                kind: 'unknown-enum-member',
                detail: `${r.routeKey} is not a member of a *Routes enum in ${MOBILE_ROUTES_FILE}`,
                file: r.navigator,
                line: r.line,
            });
    }
    for (const e of edges) {
        if (!memberKeys.has(e.target) && !/^ReceiveAddressVerificationSource\./.test(e.target))
            unresolved.push({
                platform: 'mobile',
                kind: 'edge-to-unknown-member',
                detail: e.target,
                file: e.file,
            });
    }

    // Parent route keys of each navigator file (the route under which it is registered).
    const parentsOf = new Map<string, string[]>();
    for (const r of regs) {
        if (r.isNavigator && r.componentFile && r.routeKey)
            parentsOf.set(r.componentFile, [...(parentsOf.get(r.componentFile) ?? []), r.routeKey]);
    }
    const valueOf = new Map(members.map(m => [`${m.enumName}.${m.member}`, m.value]));

    // Components registered under more than one route of the same navigator are aliases.
    const sameNavigatorRoutes = new Map<string, string[]>();
    for (const r of regs) {
        if (!r.routeKey || !r.component || r.componentKind === 'inline') continue;
        const k = `${r.navigator}#${r.componentFile}#${r.component}`;
        sameNavigatorRoutes.set(k, [...(sameNavigatorRoutes.get(k) ?? []), r.routeKey]);
    }

    const ledgerFor = (r: Registration): LedgerRow[] => {
        if (!r.componentFile) return [];
        const exact = ledger.filter(l => l.path === r.componentFile && l.symbol === r.component);
        if (exact.length) return exact;

        return ledger.filter(l => l.path === r.componentFile);
    };

    const flowMatches = new Map<string, Flow[]>();
    for (const f of flows) {
        if (f.route === SYSTEM_ALERT) {
            flowJoin.push({
                screenshot_id: f.screenshot_id,
                arrival_route: f.route,
                matched_routes: [],
                result: SYSTEM_ALERT,
            });
            continue;
        }
        const parts = f.route.split('/');
        const value = parts[parts.length - 1];
        const parentValue = parts.length > 1 ? parts[parts.length - 2] : null;
        let candidates = members
            .map(m => `${m.enumName}.${m.member}`)
            .filter(k => valueOf.get(k) === value && regs.some(r => r.routeKey === k));
        if (parentValue) {
            candidates = candidates.filter(k =>
                regs.some(
                    r =>
                        r.routeKey === k &&
                        (parentsOf.get(r.navigator) ?? []).some(
                            p => valueOf.get(p) === parentValue,
                        ),
                ),
            );
        }
        flowJoin.push({
            screenshot_id: f.screenshot_id,
            arrival_route: f.route,
            matched_routes: sortStrings(candidates),
            result: matchResult(candidates.length),
        });
        if (!candidates.length)
            unresolved.push({
                platform: 'mobile',
                kind: 'flow-arrival-route-unmatched',
                detail: `${f.screenshot_id}: ${f.route}`,
                file: 'docs/features/feature-map/parts/capture-flows.json',
            });
        if (candidates.length > 1)
            unresolved.push({
                platform: 'mobile',
                kind: 'flow-arrival-route-ambiguous',
                detail: `${f.screenshot_id}: ${f.route} matches ${candidates.length} routes; write it as Stack/Route`,
                file: 'docs/features/feature-map/parts/capture-flows.json',
            });
        // Only a unique match is a strong link.
        if (candidates.length === 1)
            flowMatches.set(candidates[0], [...(flowMatches.get(candidates[0]) ?? []), f]);
    }

    const records: Obj[] = [];
    for (const m of members) {
        const key = `${m.enumName}.${m.member}`;
        const own = regs.filter(r => r.routeKey === key);
        const ledgerRows = own.flatMap(ledgerFor);
        const ledgerFeatures = sortStrings(ledgerRows.flatMap(l => l.feature_ids));
        const features = ledgerFeatures.length
            ? ledgerFeatures
            : sortStrings([...new Set(own.flatMap(r => evidenceFeatures(r.componentFile)))]);
        const routeFlows = flowMatches.get(key) ?? [];
        const screenshotIds = sortStrings([
            ...screenshotsFor(features, shots, ['mobile']),
            ...routeFlows.map(f => f.screenshot_id),
        ]);
        const incoming = edges.filter(e => e.target === key && e.kind !== 'reference');
        const incomingFiles = sortStrings(incoming.map(e => e.file));
        const referenceFiles = sortStrings(
            edges.filter(e => e.target === key && e.kind === 'reference').map(e => e.file),
        );
        const aliasOf = sortStrings(
            own.flatMap(r =>
                (
                    sameNavigatorRoutes.get(`${r.navigator}#${r.componentFile}#${r.component}`) ??
                    []
                ).filter(k => k !== key),
            ),
        );
        const dispositions = sortStrings(ledgerRows.map(l => l.disposition));
        let status: string;
        let statusBasis: string;
        if (!own.length) {
            status = 'unregistered';
            statusBasis = 'enum member has no <X.Screen> registration in app source';
        } else if (own.every(r => r.isNavigator)) {
            status = 'navigator';
            statusBasis =
                'registered component is a nested navigator; its screens are listed separately';
        } else if (
            dispositions.some(d => INTERNAL_DISPOSITIONS.has(d)) ||
            MOBILE_INTERNAL_NAME.test(m.member)
        ) {
            status = 'internal';
            statusBasis = dispositions.some(d => INTERNAL_DISPOSITIONS.has(d))
                ? `ledger disposition ${dispositions.join(', ')}`
                : 'development route name';
        } else if (aliasOf.length && cmp(aliasOf[0], key) < 0) {
            status = 'alias';
            statusBasis = `same component as ${aliasOf[0]} in the same navigator`;
        } else {
            status = statusFor(features, screenshotIds);
            if (ledgerFeatures.length) {
                statusBasis = `ledger ${sortStrings(ledgerRows.map(l => l.ledger)).join(', ')}`;
            } else if (features.length) {
                statusBasis = 'feature implementation evidence (no ledger row)';
            } else if (own.some(r => !r.componentFile)) {
                statusBasis = 'component file unresolved';
            } else {
                statusBasis = 'no ledger row for the registered component';
            }
        }
        const first = own[0];
        records.push({
            platform: 'mobile',
            route: m.value,
            source: key,
            source_line: m.line,
            component: first ? first.component : null,
            file: first ? first.componentFile : null,
            registered_in: own.map(r => ({
                navigator: r.navigator,
                line: r.line,
                component: r.component,
                component_kind: r.componentKind,
                ...(r.inlineRenders ? { inline_renders: r.inlineRenders } : {}),
                file: r.componentFile,
                conditional: r.conditional,
                parent_routes: sortStrings(parentsOf.get(r.navigator) ?? []),
            })),
            feature_ids: features,
            ledger_dispositions: dispositions,
            screenshot_ids: screenshotIds,
            flow_ids: sortStrings(routeFlows.map(f => f.screenshot_id)),
            incoming_from: {
                count: incoming.length,
                file_count: incomingFiles.length,
                files: incomingFiles.slice(0, MAX_INCOMING_FILES),
                indirect_reference_file_count: referenceFiles.length,
                indirect_reference_files: referenceFiles.slice(0, MAX_INCOMING_FILES),
            },
            status,
            status_basis: statusBasis,
        });
    }
    records.sort((a, b) => cmp(a.source as string, b.source as string));

    // Cross-check with the ledger's navigator_registrations (README: 222 across 36 navigators).
    const mobileLedger = asObj(readJsonFile(nodePath.join(HERE, 'mobile.json')), 'mobile.json');
    const rawLedgerRegs = asArray(
        mobileLedger.navigator_registrations,
        'mobile.json.navigator_registrations',
    ).map((item, index) => {
        const reg = asObj(item, `mobile.json.navigator_registrations[${index}]`);

        return {
            navigator: asStr(
                reg.navigator,
                `mobile.json.navigator_registrations[${index}].navigator`,
            ),
            component: asStr(
                reg.component,
                `mobile.json.navigator_registrations[${index}].component`,
            ),
        };
    });
    const ledgerRegs = rawLedgerRegs.map(r => `${r.navigator}#${r.component}`);
    const ledgerRegSet = new Set(ledgerRegs);
    const parsedPairs = regs.map(r => `${r.navigator}#${r.component ?? '?'}`);
    const parsedSet = new Set(parsedPairs);
    const navigatorFiles = sortStrings(regs.map(r => r.navigator));
    const crossCheck = {
        readme_claim: '222 registrations across 36 navigators',
        ledger_navigator_registrations: ledgerRegs.length,
        ledger_navigator_files: new Set(rawLedgerRegs.map(r => r.navigator)).size,
        parsed_registrations: regs.length,
        parsed_navigator_files: navigatorFiles.length,
        parsed_nested_navigator_registrations: regs.filter(r => r.isNavigator).length,
        parsed_inline_component_registrations: regs.filter(r => r.componentKind === 'inline')
            .length,
        parsed_screen_component_registrations: regs.filter(
            r => !r.isNavigator && r.componentKind !== 'inline',
        ).length,
        parsed_conditional_registrations: regs.filter(r => r.conditional).length,
        parsed_not_in_ledger: sortStrings(
            regs
                .filter(
                    r =>
                        !r.isNavigator &&
                        r.componentKind !== 'inline' &&
                        !ledgerRegSet.has(`${r.navigator}#${r.component ?? '?'}`),
                )
                .map(
                    r =>
                        `${r.navigator}:${r.line} ${r.routeKey ?? r.nameExpr} -> ${r.component} (${r.componentKind})`,
                ),
        ),
        ledger_not_parsed: sortStrings(ledgerRegs.filter(k => !parsedSet.has(k))),
        enum_members: members.length,
        enum_count: new Set(members.map(m => m.enumName)).size,
        registered_enum_members: new Set(regs.map(r => r.routeKey).filter(Boolean)).size,
        edge_occurrences: edges.filter(e => e.kind !== 'reference').length,
        indirect_reference_files: edges.filter(e => e.kind === 'reference').length,
    };

    return { records, crossCheck };
};

// ---------------------------------------------------------------------------
// Desktop / web
// ---------------------------------------------------------------------------

type DesktopRoute = {
    name: string;
    pattern: string;
    app: string;
    params: string | null;
    flags: string[];
    line: number;
};

const parseDesktopRoutes = (): DesktopRoute[] => {
    const text = stripComments(readText(abs(DESKTOP_ROUTE_CONFIG)));
    const start = text.indexOf('[', text.search(/export\s+const\s+routes\s*=/));
    const end = skipBalanced(text, start);
    const out: DesktopRoute[] = [];
    let i = start + 1;
    while (i < end) {
        const open = text.indexOf('{', i);
        if (open < 0 || open >= end) break;
        const close = skipBalanced(text, open);
        const body = text.slice(open + 1, close - 1);
        const str = (k: string) =>
            new RegExp(`\\b${k}\\s*:\\s*['"]([^'"]*)['"]`).exec(body)?.[1] ?? null;
        out.push({
            name: str('name') ?? '',
            pattern: str('pattern') ?? '',
            app: str('app') ?? '',
            params: /\bparams\s*:\s*([\w$]+)/.exec(body)?.[1] ?? null,
            flags: sortStrings([...body.matchAll(/\b(\w+)\s*:\s*true\b/g)].map(m => m[1])),
            line: lineOf(text, open),
        });
        i = close;
    }

    return out;
};

type PageMap = Map<string, { component: string; file: string | null }>;

const parseDesktopComponents = (): PageMap => {
    const file = abs(DESKTOP_COMPONENTS);
    const { text } = moduleInfo(file);
    const start = text.indexOf('{', text.search(/export\s+const\s+desktopComponents\b[^=]*=/));
    const body = text.slice(start + 1, skipBalanced(text, start) - 1);
    const map: PageMap = new Map();
    for (const m of body.matchAll(/['"]([\w-]+)['"]\s*:\s*([\w$]+)/g)) {
        const resolved = resolveSymbol(file, m[2]);
        map.set(m[1], { component: m[2], file: resolved ? rel(resolved) : null });
    }

    return map;
};

const parseWebComponents = (): PageMap => {
    const file = abs(WEB_COMPONENTS);
    const { text } = moduleInfo(file);
    const map: PageMap = new Map();
    for (const m of text.matchAll(
        /['"]([\w-]+)['"]\s*:\s*lazy\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)\s*\.then\(\s*\(\s*\{\s*([\w$]+)\s*\}/g,
    )) {
        const target = resolveModule(file, m[2]);
        const resolved = target ? resolveSymbol(target, m[3]) : null;
        map.set(m[1], { component: m[3], file: resolved ? rel(resolved) : null });
    }

    return map;
};

/** Foreground (modal) app → component, from ForegroundAppModal's map. */
const parseForegroundApps = (): Map<
    string,
    { component: string | null; file: string | null; note?: string }
> => {
    const file = abs(FOREGROUND_APP_MODAL);
    const raw = readText(file);
    const { text } = moduleInfo(file);
    const mapStart = text.indexOf('{', text.indexOf('=', text.search(/const\s+map\s*:/)));
    const body = text.slice(mapStart + 1, skipBalanced(text, mapStart) - 1);
    const out = new Map<string, { component: string | null; file: string | null; note?: string }>();
    for (const m of body.matchAll(/(?:['"]([\w-]+)['"]|([\w$]+))\s*:\s*([\w$]+)/g)) {
        const app = m[1] ?? m[2];
        const component = m[3];
        if (component === 'null') {
            // The original comment names where the app is rendered instead.
            const lineText = raw.split('\n').find(l => l.includes(`'${app}': null`)) ?? '';
            out.set(app, { component: null, file: null, note: lineText.split('//')[1]?.trim() });
            continue;
        }
        // Local wrapper (e.g. `const FirmwareType = () => <FirmwareUpdate />`): follow the rendered tag.
        let symbol = component;
        let note: string | undefined;
        const wrapper = new RegExp(
            `const\\s+${symbol}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*<([\\w$]+)`,
        ).exec(text);
        if (wrapper) {
            note = `local wrapper ${symbol} renders <${wrapper[1]} />`;
            symbol = wrapper[1];
        }
        const resolved = resolveSymbol(file, symbol);
        out.set(app, { component: symbol, file: resolved ? rel(resolved) : null, note });
    }

    return out;
};

/** Fullscreen apps from Preloader's getFullscreenApp switch. */
const parseFullscreenApps = (): Map<string, { component: string; file: string | null }> => {
    const file = abs(PRELOADER);
    const { text } = moduleInfo(file);
    const out = new Map<string, { component: string; file: string | null }>();
    for (const m of text.matchAll(/case\s+['"]([\w-]+)['"]\s*:\s*return\s+([\w$]+)/g)) {
        const resolved = resolveSymbol(file, m[2]);
        out.set(m[1], { component: m[2], file: resolved ? rel(resolved) : null });
    }

    return out;
};

/** Files that render a foreground app themselves (`payload.app !== '<app>'` guard). */
const findForegroundRenderer = (app: string): string[] => {
    const files = walkSource(['packages/suite/src', 'suite-app/app/src', 'suite']).filter(
        f => !isNonAppSource(rel(f)),
    );
    const re = new RegExp(`payload\\.app\\s*[!=]==\\s*['"]${app}['"]`);

    return files.filter(f => re.test(moduleInfo(f).text)).map(rel);
};

const buildDesktop = (unresolved: Unresolved[], shots: Screenshot[]) => {
    const routes = parseDesktopRoutes();
    const desktopPages = parseDesktopComponents();
    const webPages = parseWebComponents();
    const foreground = parseForegroundApps();
    const fullscreen = parseFullscreenApps();
    const ledger = [
        ...loadLedger('desktop-wallet'),
        ...loadLedger('desktop-administration-services'),
    ];
    const appRouterText = readText(abs(APP_ROUTER));
    const nestedFallback = /isNestedRoute[\s\S]*hasNestedRoutes/.test(appRouterText);

    const ledgerByFile = (file: string | null): { rows: LedgerRow[]; basis: string } => {
        if (!file) return { rows: [], basis: 'none' };
        const exact = ledger.filter(l => l.path === file);
        if (exact.length) return { rows: exact, basis: 'exact-path' };
        if (/\/index\.tsx?$/.test(file)) {
            const dir = file.replace(/\/index\.tsx?$/, '/');
            const scoped = ledger.filter(l => l.path.startsWith(dir));
            if (scoped.length) return { rows: scoped, basis: 'directory-of-index' };
        }

        return { rows: [], basis: 'none' };
    };

    // Primary route for each page component: the first desktopComponents entry that maps to it
    // (e.g. `suite-index` before its compatibility fallback `suite-start`).
    const firstRouteForComponent = new Map<string, string>();
    for (const [name, page] of desktopPages) {
        if (!firstRouteForComponent.has(page.component))
            firstRouteForComponent.set(page.component, name);
    }

    const records: Obj[] = [];
    for (const r of routes) {
        const desk = desktopPages.get(r.name) ?? null;
        const web = webPages.get(r.name) ?? null;
        let component: string | null = desk?.component ?? web?.component ?? null;
        let file: string | null = desk?.file ?? web?.file ?? null;
        let renderedBy: Obj | null = null;
        if (desk || web) {
            renderedBy = {
                mechanism: 'page-component',
                evidence: sortStrings(
                    [desk ? DESKTOP_COMPONENTS : null, web ? WEB_COMPONENTS : null].filter(
                        (x): x is string => !!x,
                    ),
                ),
            };
        } else if (r.flags.includes('isNestedRoute')) {
            const parent = routes.find(
                p => p.flags.includes('hasNestedRoutes') && r.pattern.startsWith(`${p.pattern}/`),
            );
            const parentPage = parent ? desktopPages.get(parent.name) : undefined;
            if (parent && parentPage && nestedFallback) {
                component = parentPage.component;
                file = parentPage.file;
                renderedBy = {
                    mechanism: 'nested-route-parent-page',
                    parent_route: parent.name,
                    evidence: [APP_ROUTER],
                };
            }
        } else if (r.flags.includes('isFullscreenApp') && fullscreen.has(r.app)) {
            const fs_ = fullscreen.get(r.app)!;
            component = fs_.component;
            file = fs_.file;
            renderedBy = { mechanism: 'fullscreen-app', evidence: [PRELOADER] };
        } else if (r.flags.includes('isForegroundApp') && foreground.has(r.app)) {
            const fg = foreground.get(r.app)!;
            if (fg.component) {
                component = fg.component;
                file = fg.file;
                renderedBy = {
                    mechanism: 'foreground-app-modal',
                    evidence: [FOREGROUND_APP_MODAL],
                    ...(fg.note ? { note: fg.note } : {}),
                };
            } else {
                const renderers = findForegroundRenderer(r.app);
                if (renderers.length) {
                    file = renderers[0];
                    component = nodePath.basename(file).replace(/\.tsx?$/, '');
                    renderedBy = {
                        mechanism: 'foreground-app-layer',
                        evidence: sortStrings([FOREGROUND_APP_MODAL, ...renderers]),
                        ...(fg.note ? { note: fg.note } : {}),
                    };
                }
            }
        }
        if (!renderedBy)
            unresolved.push({
                platform: 'desktop-web',
                kind: 'route-renderer-unresolved',
                detail: `${r.name} (${r.pattern}, app ${r.app}, flags ${r.flags.join(',') || 'none'})`,
                file: DESKTOP_ROUTE_CONFIG,
                line: r.line,
            });
        else if (!file)
            unresolved.push({
                platform: 'desktop-web',
                kind: 'component-file-unresolved',
                detail: `${r.name} -> ${component}`,
                file: DESKTOP_ROUTE_CONFIG,
                line: r.line,
            });
        let platformDifference: { desktop: typeof desk | null; web: typeof web | null } | null =
            null;
        if (desk && web && (desk.component !== web.component || desk.file !== web.file)) {
            platformDifference = { desktop: desk, web };
        } else if (!desk && web) {
            platformDifference = { desktop: null, web };
        } else if (desk && !web && renderedBy?.mechanism === 'page-component') {
            platformDifference = { desktop: desk, web: null };
        }
        const ledgerFiles = sortStrings(
            [file, platformDifference?.web?.file ?? null].filter((x): x is string => !!x),
        );
        const joined = ledgerFiles.map(ledgerByFile);
        const rows = joined.flatMap(j => j.rows);
        const ledgerFeatures = sortStrings(rows.flatMap(l => l.feature_ids));
        const features = ledgerFeatures.length
            ? ledgerFeatures
            : sortStrings([...new Set(ledgerFiles.flatMap(evidenceFeatures))]);
        const dispositions = sortStrings(rows.map(l => l.disposition));
        const screenshotIds = sortStrings(screenshotsFor(features, shots, ['desktop', 'web']));
        const aliasOf =
            component && renderedBy?.mechanism === 'page-component'
                ? firstRouteForComponent.get(component)
                : undefined;
        let status: string;
        let statusBasis: string;
        if (
            dispositions.some(d => INTERNAL_DISPOSITIONS.has(d)) ||
            DESKTOP_INTERNAL_NAME.test(r.name)
        ) {
            status = 'internal';
            statusBasis = dispositions.some(d => INTERNAL_DISPOSITIONS.has(d))
                ? `ledger disposition ${dispositions.join(', ')}`
                : 'development route name';
        } else if (aliasOf && aliasOf !== r.name) {
            status = 'alias';
            statusBasis = `same page component as ${aliasOf}`;
        } else {
            status = statusFor(features, screenshotIds);
            if (!ledgerFeatures.length && features.length) {
                statusBasis = 'feature implementation evidence (no ledger row)';
            } else if (features.length) {
                statusBasis = `ledger ${sortStrings(rows.map(l => l.ledger)).join(', ')} (${sortStrings(
                    joined.map(j => j.basis).filter(b => b !== 'none'),
                ).join(', ')})`;
            } else if (renderedBy) {
                statusBasis = 'no ledger row for the rendering component';
            } else {
                statusBasis = 'renderer unresolved';
            }
        }
        records.push({
            platform: 'desktop-web',
            route: r.name,
            source: r.pattern,
            source_line: r.line,
            app: r.app,
            params: r.params,
            flags: r.flags,
            component,
            file,
            rendered_by: renderedBy ?? 'unresolved',
            platform_difference: platformDifference,
            feature_ids: features,
            ledger_dispositions: dispositions,
            screenshot_ids: screenshotIds,
            status,
            status_basis: statusBasis,
        });
    }
    records.sort((a, b) => cmp(a.route as string, b.route as string));

    return { records, routeCount: routes.length };
};

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const STATUS_ORDER = [
    'covered',
    'features-only',
    'unmapped',
    'internal',
    'alias',
    'navigator',
    'unregistered',
];

const countStatuses = (records: Obj[]) => {
    const counts: Record<string, number> = {};
    for (const s of STATUS_ORDER) counts[s] = 0;
    for (const r of records) counts[r.status as string] = (counts[r.status as string] ?? 0) + 1;

    return counts;
};

const PRINT_WIDTH = 100;

/**
 * JSON in the layout Prettier gives it (printWidth 100, tabWidth 4): objects expanded, arrays of
 * scalars on one line when the line fits (trailing comma included), otherwise one item per line.
 */
const prettierJson = (value: unknown, level = 0, prefixWidth = 0, suffixWidth = 0): string => {
    const pad = (n: number) => ' '.repeat(4 * n);
    if (value === null || typeof value !== 'object')
        return pyJsonDumps(value, { ensureAscii: false });
    if (Array.isArray(value)) {
        if (!value.length) return '[]';
        const scalar = value.every(v => v === null || typeof v !== 'object');
        if (scalar) {
            const flat = `[${value.map(v => pyJsonDumps(v, { ensureAscii: false })).join(', ')}]`;
            if (pad(level).length + prefixWidth + [...flat].length + suffixWidth <= PRINT_WIDTH)
                return flat;
        }
        const items = value.map(
            (v, i) => pad(level + 1) + prettierJson(v, level + 1, 0, i < value.length - 1 ? 1 : 0),
        );

        return `[\n${items.join(',\n')}\n${pad(level)}]`;
    }
    const entries = Object.entries(value as Obj);
    if (!entries.length) return '{}';
    const items = entries.map(([k, v], i) => {
        const key = `${pyJsonDumps(k, { ensureAscii: false })}: `;

        return (
            pad(level + 1) +
            key +
            prettierJson(v, level + 1, [...key].length, i < entries.length - 1 ? 1 : 0)
        );
    });

    return `{\n${items.join(',\n')}\n${pad(level)}}`;
};

const mdCell = (value: string) => value.replace(/[\\|]/g, '\\$&').replace(/\r?\n/g, ' ');

/** Markdown table already in Prettier's aligned form. */
const mdTable = (header: string[], rows: string[][]): string => {
    const all = [header, ...rows].map(r => r.map(mdCell));
    const widths = header.map((_, i) => Math.max(3, ...all.map(r => r[i].length)));
    const line = (r: string[]) => `| ${r.map((c, i) => c.padEnd(widths[i])).join(' | ')} |`;

    return [
        line(all[0]),
        `| ${widths.map(w => '-'.repeat(w)).join(' | ')} |`,
        ...all.slice(1).map(line),
    ].join('\n');
};

const code = (s: unknown) => (s === null || s === undefined || s === '' ? '-' : `\`${String(s)}\``);

type StatusTotals = Record<string, number> & { routes: number };
type MobileCrossCheck = {
    readme_claim: string;
    ledger_navigator_registrations: number;
    ledger_navigator_files: number;
    parsed_registrations: number;
    parsed_navigator_files: number;
    parsed_nested_navigator_registrations: number;
    parsed_inline_component_registrations: number;
    parsed_screen_component_registrations: number;
    parsed_conditional_registrations: number;
    parsed_not_in_ledger: string[];
    ledger_not_parsed: string[];
    enum_members: number;
    enum_count: number;
    registered_enum_members: number;
    edge_occurrences: number;
    indirect_reference_files: number;
};
type ReportData = {
    status_rules: Record<string, string>;
    totals: Record<'mobile' | 'desktop-web', StatusTotals>;
    flow_join: Obj[];
    unresolved: Unresolved[];
    routes: Obj[];
};

const renderMarkdown = (data: ReportData, cc: MobileCrossCheck, flowsPresent: boolean): string => {
    const { routes } = data;
    const out: string[] = [];
    out.push('# Route coverage');
    out.push('');
    out.push(
        'Generated by `node docs/features/feature-map/screen-audit/routes.ts`; `--check` fails when this file or `route-coverage.json` is stale. Static source parsing only: a route listed here is registered in source, not proven reachable at runtime. Features come from the screen-audit ledgers joined by component file; screenshots are runtime captures sharing a feature with the route, plus capture flows whose `arrival.route` resolves to exactly this route. Mobile `incoming_from` counts direct `navigate`/`push`/`replace`/`popTo` calls and `screen:`/`name:` route objects; other value references are listed separately as indirect. Routes with no incoming edge are usually a stack’s first screen or a state-selected screen (e.g. connection guards, PIN steps).',
    );
    out.push('');
    out.push('## Totals');
    out.push('');
    const totalRows = (['mobile', 'desktop-web'] as const).map(p => {
        const t = data.totals[p];

        return [p, String(t.routes), ...STATUS_ORDER.map(s => String(t[s]))];
    });
    out.push(mdTable(['Platform', 'Routes', ...STATUS_ORDER], totalRows));
    out.push('');
    out.push(
        `Status rules: ${STATUS_ORDER.map(s => `\`${s}\` ${data.status_rules[s]}`).join('; ')}.`,
    );
    out.push('');
    out.push(
        `Capture flows: ${
            flowsPresent
                ? `${data.flow_join.length} flows joined by \`arrival.route\` (${data.flow_join.filter(f => f.result === 'unique').length} unique, ${data.flow_join.filter(f => f.result === 'ambiguous').length} ambiguous, ${data.flow_join.filter(f => f.result === SYSTEM_ALERT).length} system-alert, ${data.flow_join.filter(f => f.result === 'no-match').length} unmatched).`
                : '`parts/capture-flows.json` is absent, so no flow links were joined.'
        }`,
    );
    out.push('');
    out.push('## Registration count cross-check');
    out.push('');
    out.push(
        `The screen-audit README states ${cc.readme_claim}; the mobile ledger lists ${cc.ledger_navigator_registrations} \`navigator_registrations\` in ${cc.ledger_navigator_files} navigator files. This parser finds ${cc.parsed_registrations} \`<X.Screen>\` registrations in ${cc.parsed_navigator_files} app navigator files: ${cc.parsed_screen_component_registrations} screen components, ${cc.parsed_nested_navigator_registrations} nested navigators and ${cc.parsed_inline_component_registrations} inline function components (${cc.parsed_conditional_registrations} conditional). The ledger counts screen-component registrations only, so the difference of ${cc.parsed_registrations - cc.ledger_navigator_registrations} is ${cc.parsed_nested_navigator_registrations} nested-navigator registrations plus ${cc.parsed_inline_component_registrations} inline function components that the ledger omits; navigator files ${cc.parsed_navigator_files === cc.ledger_navigator_files ? 'match' : `differ (${cc.parsed_navigator_files} vs ${cc.ledger_navigator_files})`}. Screen registrations not in the ledger: ${cc.parsed_not_in_ledger.length}; ledger registrations not found by the parser: ${cc.ledger_not_parsed.length}. ${cc.enum_members} enum members in ${cc.enum_count} \`*Routes\` enums; ${cc.registered_enum_members} are registered.`,
    );
    out.push('');
    if (cc.parsed_not_in_ledger.length) {
        for (const item of cc.parsed_not_in_ledger) out.push(`- Not in ledger: \`${item}\``);
        out.push('');
    }
    if (cc.ledger_not_parsed.length) {
        for (const item of cc.ledger_not_parsed) out.push(`- Not parsed: \`${item}\``);
        out.push('');
    }
    const gapTable = (status: string) => {
        const rows = routes.filter(r => r.status === status);
        out.push(
            `## ${status === 'unmapped' ? 'Unmapped' : 'Features-only'} routes (${rows.length})`,
        );
        out.push('');
        if (!rows.length) {
            out.push('None.');
            out.push('');

            return;
        }
        out.push(
            mdTable(
                [
                    'Platform',
                    'Route',
                    'Source',
                    'Component',
                    'File',
                    status === 'unmapped' ? 'Basis' : 'Features',
                ],
                rows.map(r => [
                    r.platform as string,
                    code(r.route),
                    code(r.source),
                    code(r.component),
                    code(r.file),
                    status === 'unmapped'
                        ? (r.status_basis as string)
                        : (r.feature_ids as string[]).map(f => `\`${f}\``).join(', '),
                ]),
            ),
        );
        out.push('');
    };
    gapTable('unmapped');
    gapTable('features-only');
    out.push(`## Unresolved parsing gaps (${data.unresolved.length})`);
    out.push('');
    if (data.unresolved.length) {
        out.push(
            mdTable(
                ['Platform', 'Kind', 'Detail', 'File'],
                (data.unresolved as Unresolved[]).map(u => [
                    u.platform,
                    u.kind,
                    code(u.detail),
                    code(u.line ? `${u.file}:${u.line}` : u.file),
                ]),
            ),
        );
    } else out.push('None.');
    out.push('');
    out.push('## All routes');
    out.push('');
    out.push('<details>');
    out.push('<summary>Every route with status, screenshots and flows</summary>');
    out.push('');
    out.push(
        mdTable(
            [
                'Platform',
                'Route',
                'Source',
                'Status',
                'Features',
                'Screenshots',
                'Flows',
                'Incoming',
            ],
            routes.map(r => [
                r.platform as string,
                code(r.route),
                code(r.source),
                r.status as string,
                String((r.feature_ids as string[]).length),
                String((r.screenshot_ids as string[]).length),
                r.platform === 'mobile' ? String((r.flow_ids as string[]).length) : '-',
                r.platform === 'mobile'
                    ? String((r.incoming_from as Obj).file_count as number)
                    : '-',
            ]),
        ),
    );
    out.push('');
    out.push('</details>');
    out.push('');

    return out.join('\n');
};

/** `flowsOverride` lets a caller test the flow join without parts/capture-flows.json. */
export const generateRouteCoverage = (flowsOverride?: {
    present: boolean;
    flows: Flow[];
}): {
    json: string;
    md: string;
    summary: {
        totals: Record<'mobile' | 'desktop-web', StatusTotals>;
        unresolved: number;
        flow_join: number;
    };
} => {
    moduleCache.clear();
    workspaceCache = null;
    const unresolved: Unresolved[] = [];
    const shots = loadScreenshots();
    evidenceFeatures = loadEvidenceIndex();
    const { present: flowsPresent, flows } = flowsOverride ?? loadFlows();
    const flowJoin: Obj[] = [];
    const mobile = buildMobile(unresolved, shots, flows, flowJoin);
    const desktop = buildDesktop(unresolved, shots);
    const allRecords = [...mobile.records, ...desktop.records];
    unresolved.sort(
        (a, b) =>
            cmp(a.platform, b.platform) ||
            cmp(a.kind, b.kind) ||
            cmp(a.file, b.file) ||
            (a.line ?? 0) - (b.line ?? 0) ||
            cmp(a.detail, b.detail),
    );
    flowJoin.sort((a, b) => cmp(a.screenshot_id as string, b.screenshot_id as string));

    const data = {
        generated_by: 'docs/features/feature-map/screen-audit/routes.ts',
        description:
            'Route completeness check. Every mobile *Routes enum member and every desktop/web route from routeConfig, with how it is rendered, the screen-audit ledger features, runtime screenshots and capture flows that reach it.',
        sources: {
            mobile_routes: MOBILE_ROUTES_FILE,
            mobile_registrations:
                'suite-native/**, suite-native-app/** (<X.Screen> JSX, tests/stories/e2e excluded)',
            desktop_routes: DESKTOP_ROUTE_CONFIG,
            desktop_components: DESKTOP_COMPONENTS,
            web_components: WEB_COMPONENTS,
            renderers: [APP_ROUTER, FOREGROUND_APP_MODAL, PRELOADER],
            ledgers: [
                'docs/features/feature-map/screen-audit/mobile.json',
                'docs/features/feature-map/screen-audit/desktop-wallet.json',
                'docs/features/feature-map/screen-audit/desktop-administration-services.json',
            ],
            screenshots: 'docs/features/feature-map/features.json runtime.screenshots',
            capture_flows: flowsPresent
                ? 'docs/features/feature-map/parts/capture-flows.json'
                : 'docs/features/feature-map/parts/capture-flows.json (absent: no flows joined)',
        },
        status_rules: {
            covered:
                'has ledger features and at least one screenshot (feature intersection or capture flow arrival)',
            'features-only': 'has features (ledger or implementation evidence), no screenshot',
            unmapped:
                'no feature in any ledger or feature implementation evidence for the rendering component',
            internal:
                'ledger disposition excluded-internal/internal-reference, or a development route name (mobile /DevUtils|MessageSystem|AppsEmbedding|Storybook|Debug/, desktop /debug|embedding|storybook/)',
            alias: 'renders the same component as an earlier route: desktop non-nested routes sharing a page component; mobile routes sharing a component within one navigator',
            navigator:
                'mobile only: the registered component is a nested navigator whose screens are separate records',
            unregistered:
                'mobile only: enum member with no `<X.Screen>` registration in app source',
        },
        totals: {
            mobile: { routes: mobile.records.length, ...countStatuses(mobile.records) },
            'desktop-web': { routes: desktop.records.length, ...countStatuses(desktop.records) },
        },
        mobile_registration_cross_check: mobile.crossCheck,
        flow_join: flowJoin,
        unresolved,
        routes: allRecords,
    };
    const json = prettierJson(data) + '\n';

    return {
        json,
        md: renderMarkdown(data, mobile.crossCheck, flowsPresent),
        summary: {
            totals: data.totals,
            unresolved: data.unresolved.length,
            flow_join: data.flow_join.length,
        },
    };
};

/** Differences between the committed files and a fresh generation (empty when up to date). */
export const checkRouteCoverage = (): string[] => {
    const { json, md } = generateRouteCoverage();
    const problems: string[] = [];
    for (const [path, expected] of [
        [JSON_OUT, json],
        [MD_OUT, md],
    ] as const) {
        if (!fs.existsSync(path)) problems.push(`${rel(path)} is missing`);
        else if (fs.readFileSync(path, 'utf8') !== expected)
            problems.push(`${rel(path)} is stale; run node ${rel(import.meta.filename)}`);
    }

    return problems;
};

const main = () => {
    if (process.argv.includes('--check')) {
        const problems = checkRouteCoverage();
        if (problems.length) {
            process.stderr.write(problems.join('\n') + '\n');
            process.exit(1);
        }
        process.stdout.write('route coverage is up to date\n');

        return;
    }
    const { json, md, summary } = generateRouteCoverage();
    fs.writeFileSync(JSON_OUT, json);
    fs.writeFileSync(MD_OUT, md);
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
};

if (isMain(import.meta.filename)) main();
