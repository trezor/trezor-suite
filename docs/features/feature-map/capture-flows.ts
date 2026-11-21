// Validate the replayable capture flows (parts/capture-flows.json), replay them on a simulator
// through agent-device, and OCR-check that each mobile capture shows its flow's arrival landmarks.
//
//   node capture-flows.ts [validate] [--root <feature-map-dir>]
//   node capture-flows.ts check [--root <feature-map-dir>]
//   node capture-flows.ts replay --agent-device <cli> [--device <name>] [--start-state <state>]
//       [--setup] [--update-captures] [ids...]
//
// --root points at another feature-map directory (used for test fixtures); native source and
// routes are always read from the repository checkout.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as nodePath from 'node:path';

import { OCR_PASSES, type ReplayStep, replayFlow } from './flow-replay.ts';
import { FEATURE_MAP_DIR, REPO_ROOT, dumpJson, isMain } from './pylib.ts';

type Plain = { [key: string]: unknown };

type Step = ReplayStep;
type Replay = { device: string; date: string; result: string; landing: string; note: string };
type Flow = {
    screenshot_id: string;
    start_state: string;
    steps: Step[];
    arrival: { route: string; landmarks: string[] };
    status: string;
    note?: string;
    replays: Replay[];
};
type StartState = { description: string; prepare?: string; setup: Step[] };
type CaptureFlows = {
    app_id: string;
    recorded_on: string;
    start_states: Record<string, StartState>;
    flows: Flow[];
};

export type ValidationResult = {
    errors: string[];
    warnings: string[];
    flows: Flow[];
};

type LandingCheck = {
    screenshot_id: string;
    image: string;
    device: string;
    found: string[];
    missing: string[];
    result: 'pass' | 'drift';
    /** SHA-256 of the checked PNG, so a replaced capture cannot keep an old result. */
    sha256: string;
};

const sha256Of = (path: string): string =>
    createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const FLOWS_JSON = 'parts/capture-flows.json';
const SCHEMA_JSON = 'capture-flows.schema.json';
const FLOW_CHECKS_JSON = 'runtime/flow-checks.json';
const VARIANTS_JSON = 'parts/runtime-device-variants.json';
const FM_PREFIX = 'docs/features/feature-map/';
const ROUTES_SOURCE = 'suite-native/navigation/src/routes.ts';
const SYSTEM_ALERT = 'system-alert';
const GENERATED_BY = 'capture-flows.ts check';

/** Steps that need `text`, and those that need `id`. */
const TEXT_STEPS = new Set(['scroll_to', 'wait_text']);
const ALERT_VALUES = new Set(['accept', 'dismiss']);

/**
 * testIDs that the source only builds from templates. Each value must be the template applied to a
 * value proven by `values_from`; `source` must still contain the template literal.
 */
const TEMPLATE_TEST_IDS: {
    template: string;
    source: string;
    proof: string;
    values: string[];
}[] = [
    {
        // TabBar.tsx passes `testID={route.name}`; tab route names are AppTabsRoutes values.
        template: '`@tabBar/${testID}`',
        source: 'suite-native/navigation/src/components/TabBarItem.tsx',
        proof: 'suite-native/navigation/src/components/TabBar.tsx',
        values: [
            '@tabBar/HomeStack',
            '@tabBar/AccountsStack',
            '@tabBar/Trading',
            '@tabBar/EarnStack',
            '@tabBar/Settings',
        ],
    },
    {
        template: '`@tabBar/${testID}/title`',
        source: 'suite-native/navigation/src/components/TabBarItem.tsx',
        proof: 'suite-native/navigation/src/components/TabBar.tsx',
        values: [
            '@tabBar/HomeStack/title',
            '@tabBar/AccountsStack/title',
            '@tabBar/Trading/title',
            '@tabBar/EarnStack/title',
            '@tabBar/Settings/title',
        ],
    },
];

const isPlain = (value: unknown): value is Plain =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const readJsonFile = (path: string): unknown => JSON.parse(fs.readFileSync(path, 'utf8'));

const parseRoot = (args: string[]): { root: string; rest: string[] } => {
    const rest: string[] = [];
    let root = FEATURE_MAP_DIR;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--root') {
            const value = args[++i];
            if (!value) throw new Error('--root requires a directory');
            root = nodePath.resolve(value);
        } else if (args[i].startsWith('--root=')) {
            root = nodePath.resolve(args[i].slice('--root='.length));
        } else {
            rest.push(args[i]);
        }
    }

    return { root, rest };
};

// ---------------------------------------------------------------------------
// Minimal JSON Schema (2020-12 subset used by capture-flows.schema.json)
// ---------------------------------------------------------------------------

const jsonType = (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';

    return typeof value;
};

const matchesType = (value: unknown, type: string): boolean => {
    const actual = jsonType(value);

    return actual === type || (type === 'number' && actual === 'integer');
};

const validateSchema = (
    value: unknown,
    schema: Plain,
    root: Plain,
    path: string,
    errors: string[],
): void => {
    if (typeof schema.$ref === 'string') {
        const ref = schema.$ref;
        if (!ref.startsWith('#/$defs/')) throw new Error(`Unsupported schema $ref ${ref}`);
        const defs = root.$defs as Plain;
        const target = defs[ref.slice('#/$defs/'.length)];
        if (!isPlain(target)) throw new Error(`Unknown schema $ref ${ref}`);
        validateSchema(value, target, root, path, errors);

        return;
    }
    if (schema.type !== undefined) {
        const types = Array.isArray(schema.type) ? (schema.type as string[]) : [schema.type];
        if (!types.some(type => matchesType(value, type as string))) {
            errors.push(`${path}: expected ${types.join('|')}, got ${jsonType(value)}`);

            return;
        }
    }
    if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
        errors.push(`${path}: ${JSON.stringify(value)} is not one of ${schema.enum.join(', ')}`);
    }
    if (typeof value === 'string') {
        if (typeof schema.minLength === 'number' && value.length < schema.minLength)
            errors.push(`${path}: shorter than ${schema.minLength}`);
        if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern, 'u').test(value))
            errors.push(`${path}: ${JSON.stringify(value)} does not match ${schema.pattern}`);
    }
    if (typeof value === 'number' && typeof schema.minimum === 'number' && value < schema.minimum) {
        errors.push(`${path}: below ${schema.minimum}`);
    }
    if (Array.isArray(value)) {
        if (typeof schema.minItems === 'number' && value.length < schema.minItems)
            errors.push(`${path}: fewer than ${schema.minItems} items`);
        if (typeof schema.maxItems === 'number' && value.length > schema.maxItems)
            errors.push(`${path}: more than ${schema.maxItems} items`);
        if (schema.uniqueItems === true) {
            const seen = new Set(value.map(item => JSON.stringify(item)));
            if (seen.size !== value.length) errors.push(`${path}: items are not unique`);
        }
        if (isPlain(schema.items)) {
            const itemSchema = schema.items;
            value.forEach((item, index) =>
                validateSchema(item, itemSchema, root, `${path}[${index}]`, errors),
            );
        }
    }
    if (isPlain(value)) {
        const properties = isPlain(schema.properties) ? schema.properties : {};
        for (const key of Array.isArray(schema.required) ? (schema.required as string[]) : []) {
            if (!Object.hasOwn(value, key)) errors.push(`${path}: missing required "${key}"`);
        }
        for (const [key, item] of Object.entries(value)) {
            const propertySchema = properties[key];
            if (isPlain(propertySchema)) {
                validateSchema(item, propertySchema, root, `${path}.${key}`, errors);
            } else if (schema.additionalProperties === false) {
                errors.push(`${path}: unexpected property "${key}"`);
            }
        }
    }
};

// ---------------------------------------------------------------------------
// Repository facts: routes, testIDs, labels
// ---------------------------------------------------------------------------

export const readRouteValues = (): Set<string> => {
    const source = fs.readFileSync(nodePath.join(REPO_ROOT, ROUTES_SOURCE), 'utf8');
    const values = new Set<string>();
    for (const enumMatch of source.matchAll(/export enum \w+\s*\{([^}]*)\}/g)) {
        for (const member of enumMatch[1].matchAll(/\w+\s*=\s*'([^']+)'/g)) values.add(member[1]);
    }
    if (!values.size) throw new Error(`No route enums parsed from ${ROUTES_SOURCE}`);

    return values;
};

const isKnownRoute = (route: string, routes: Set<string>): boolean => {
    if (route === SYSTEM_ALERT) return true;
    const parts = route.split('/');

    return parts.length <= 2 && parts.every(part => routes.has(part));
};

type SourceFile = { path: string; text: string; lower: string };

let nativeSourceCache: SourceFile[] | null = null;

/** Tracked native TypeScript source outside e2e (suite-native/**, suite-native-app/**). */
const readNativeSource = (): SourceFile[] => {
    if (nativeSourceCache) return nativeSourceCache;
    const listed = execFileSync(
        'git',
        ['ls-files', '-z', '--', 'suite-native', 'suite-native-app'],
        {
            cwd: REPO_ROOT,
            encoding: 'utf8',
            maxBuffer: 64 * 1024 * 1024,
        },
    );
    nativeSourceCache = listed
        .split('\0')
        .filter(
            path =>
                /\.tsx?$/.test(path) &&
                !path.split('/').includes('node_modules') &&
                !path.split('/').includes('e2e'),
        )
        .sort()
        .flatMap(path => {
            const absolute = nodePath.join(REPO_ROOT, path);
            if (!fs.existsSync(absolute)) return [];
            const text = fs.readFileSync(absolute, 'utf8');

            return [{ path, text, lower: text.toLowerCase() }];
        });

    return nativeSourceCache;
};

/** Source spellings of a string literal or JSX text. */
const literalForms = (value: string): string[] => [
    `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`,
    `'${value}'`,
    `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`,
    `\`${value}\``,
    `>${value}<`,
];

const findLiteral = (value: string, sources: SourceFile[], ignoreCase: boolean): string | null => {
    const forms = literalForms(ignoreCase ? value.toLowerCase() : value);
    const jsx = new RegExp(
        `>\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<`,
        ignoreCase ? 'i' : '',
    );
    for (const file of sources) {
        const text = ignoreCase ? file.lower : file.text;
        if (forms.some(form => text.includes(form)) || jsx.test(file.text)) return file.path;
    }

    return null;
};

/**
 * A template literal that builds `id` from a static prefix and one interpolated segment, e.g.
 * `@coin-enabling/backends-${symbol}` for @coin-enabling/backends-btc.
 */
const findTemplate = (id: string, sources: SourceFile[]): string | null => {
    for (let cut = id.length - 1; cut > 0; cut--) {
        if (!/^[A-Za-z0-9]+$/.test(id.slice(cut))) break;
        const needle = `\`${id.slice(0, cut)}\${`;
        const file = sources.find(source => source.text.includes(needle));
        if (file) return file.path;
    }

    return null;
};

/** Case-insensitive substring search, for visible text that may be part of a longer message. */
const findText = (text: string, sources: SourceFile[]): string | null => {
    const needle = text.toLowerCase();

    return sources.find(file => file.lower.includes(needle))?.path ?? null;
};

const templateTestIds = (routes: Set<string>, errors: string[]): Map<string, string> => {
    const resolved = new Map<string, string>();
    for (const entry of TEMPLATE_TEST_IDS) {
        const sourcePath = nodePath.join(REPO_ROOT, entry.source);
        const proofPath = nodePath.join(REPO_ROOT, entry.proof);
        if (
            !fs.existsSync(sourcePath) ||
            !fs.readFileSync(sourcePath, 'utf8').includes(entry.template)
        ) {
            errors.push(`template testID ${entry.template} no longer exists in ${entry.source}`);
            continue;
        }
        if (
            !fs.existsSync(proofPath) ||
            !fs.readFileSync(proofPath, 'utf8').includes('testID={route.name}')
        ) {
            errors.push(`template testID proof "testID={route.name}" missing in ${entry.proof}`);
            continue;
        }
        const [prefix, suffix] = entry.template.slice(1, -1).split('${testID}');
        for (const value of entry.values) {
            const routeName = value.slice(prefix.length, value.length - suffix.length);
            if (!value.startsWith(prefix) || !value.endsWith(suffix) || !routes.has(routeName)) {
                errors.push(
                    `template testID allowlist value ${value} is not ${entry.template} of a route`,
                );
                continue;
            }
            resolved.set(value, entry.source);
        }
    }

    return resolved;
};

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------

type Manifest = {
    screenshots: Map<string, string>;
    baseDevice: Map<string, string>;
    variants: { screenshotId: string; device: string; image: string }[];
    preferredDevice: string;
};

/** FM-relative path of a repo-relative screenshot path. */
const fmPath = (repoPath: string): string =>
    repoPath.startsWith(FM_PREFIX) ? repoPath.slice(FM_PREFIX.length) : repoPath;

const readManifest = (root: string): Manifest => {
    const observations = readJsonFile(
        nodePath.join(root, 'parts/runtime-mobile-observations.json'),
    );
    const screenshots = new Map<string, string>();
    for (const shot of (observations as { screenshots: { id: string; path: string }[] })
        .screenshots)
        screenshots.set(shot.id, fmPath(shot.path));
    const variantsFile = readJsonFile(nodePath.join(root, VARIANTS_JSON)) as {
        preferred_device: string;
        base_devices: { device: string; screenshot_ids: string[] }[];
        variants: { variant_of: string; device: string; path: string }[];
    };
    const baseDevice = new Map<string, string>();
    for (const base of variantsFile.base_devices)
        for (const id of base.screenshot_ids) baseDevice.set(id, base.device);

    return {
        screenshots,
        baseDevice,
        variants: variantsFile.variants
            .filter(variant => screenshots.has(variant.variant_of))
            .map(variant => ({
                screenshotId: variant.variant_of,
                device: variant.device,
                image: fmPath(variant.path),
            })),
        preferredDevice: variantsFile.preferred_device,
    };
};

export const validateCaptureFlows = (root: string = FEATURE_MAP_DIR): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const flowsPath = nodePath.join(root, FLOWS_JSON);
    if (!fs.existsSync(flowsPath)) {
        return { errors: [`${FLOWS_JSON} is missing`], warnings, flows: [] };
    }
    const data = readJsonFile(flowsPath);
    const schema = readJsonFile(nodePath.join(FEATURE_MAP_DIR, SCHEMA_JSON)) as Plain;
    validateSchema(data, schema, schema, FLOWS_JSON, errors);
    if (errors.length) return { errors, warnings, flows: [] };

    const { flows } = data as CaptureFlows;
    const manifest = readManifest(root);
    const routes = readRouteValues();
    const templateIds = templateTestIds(routes, errors);
    const sources = readNativeSource();

    const ids = flows.map(flow => flow.screenshot_id);
    const sorted = [...ids].sort();
    if (ids.some((id, index) => id !== sorted[index]))
        errors.push(`${FLOWS_JSON}: flows are not sorted by screenshot_id`);
    const seen = new Set<string>();
    for (const id of ids) {
        if (seen.has(id)) errors.push(`${FLOWS_JSON}: duplicate flow for ${id}`);
        seen.add(id);
        if (!manifest.screenshots.has(id))
            errors.push(`${FLOWS_JSON}: unknown mobile screenshot ${id}`);
    }
    for (const id of manifest.screenshots.keys()) {
        if (!seen.has(id)) errors.push(`${FLOWS_JSON}: mobile screenshot ${id} has no flow`);
    }

    const stepIds = new Map<string, string>();
    const stepTexts = new Map<string, string>();
    const checkSteps = (steps: Step[], where: string) => {
        steps.forEach((step, index) => {
            const at = `${where} step ${index + 1}`;
            if (!isKnownRoute(step.lands_on, routes))
                errors.push(`${at}: lands_on ${step.lands_on} is not a native route value`);
            if (step.do === 'launch' && index !== 0)
                errors.push(`${at}: launch must be the first step`);
            if (step.do === 'tap' && !step.id && !step.text)
                errors.push(`${at}: tap needs id or text`);
            if (step.do === 'tap' && step.id && step.text)
                errors.push(`${at}: tap takes id or text, not both`);
            if (step.right_of !== undefined && !step.id) errors.push(`${at}: right_of needs id`);
            if ((step.dx ?? step.dy ?? step.x_from_right) !== undefined && !step.text)
                errors.push(`${at}: dx, dy and x_from_right need text`);
            if (TEXT_STEPS.has(step.do) && !step.text) errors.push(`${at}: ${step.do} needs text`);
            if (step.do === 'type' && step.value === undefined)
                errors.push(`${at}: type needs value`);
            if (step.do === 'alert' && !ALERT_VALUES.has(step.value ?? ''))
                errors.push(`${at}: alert value must be accept or dismiss`);
            for (const id of [step.id, step.test_id])
                if (id && !stepIds.has(id)) stepIds.set(id, at);
            if (step.text && !stepTexts.has(step.text)) stepTexts.set(step.text, at);
        });
    };
    const { start_states: startStates } = data as CaptureFlows;
    for (const [name, state] of Object.entries(startStates)) {
        const where = `${FLOWS_JSON} start_states.${name}`;
        checkSteps(state.setup, where);
        if (state.prepare !== undefined && state.setup.length)
            errors.push(
                `${where}: states with prepare are set up outside the app and have no setup steps`,
            );
        if (state.prepare === undefined && state.setup[0]?.do !== 'launch')
            errors.push(`${where}: setup must start with launch`);
    }

    for (const flow of flows) {
        const where = `${FLOWS_JSON} ${flow.screenshot_id}`;
        if (!isKnownRoute(flow.arrival.route, routes))
            errors.push(
                `${where}: arrival.route ${flow.arrival.route} is not a native route value`,
            );
        if (flow.status === 'draft' && flow.replays.length)
            errors.push(`${where}: draft flows have no replays`);
        const latest = flow.replays[flow.replays.length - 1];
        if (flow.status === 'replayed' && (latest?.result !== 'pass' || latest.landing !== 'pass'))
            errors.push(
                `${where}: replayed flows need a latest replay with result and landing pass`,
            );
        if (flow.status === 'drifted' && latest?.result === 'pass' && latest.landing === 'pass')
            errors.push(`${where}: drifted flows need a latest replay that diverged or drifted`);
        if (flow.status === 'not-reproducible') {
            if (flow.steps.length) errors.push(`${where}: not-reproducible flows have no steps`);
            continue;
        }
        if (!flow.steps.length) errors.push(`${where}: flow has no steps`);
        else if (flow.steps[0].do !== 'launch') errors.push(`${where}: first step must be launch`);
        checkSteps(flow.steps, where);
        const last = flow.steps[flow.steps.length - 1];
        if (last && last.lands_on.split('/').pop() !== flow.arrival.route.split('/').pop())
            errors.push(
                `${where}: last step lands_on ${last.lands_on} differs from arrival ${flow.arrival.route}`,
            );
    }

    for (const [id, where] of [...stepIds].sort()) {
        if (templateIds.has(id)) continue;
        if (!findLiteral(id, sources, false) && !findTemplate(id, sources))
            errors.push(`${where}: testID ${JSON.stringify(id)} not found in native source`);
    }
    for (const [text, where] of [...stepTexts].sort()) {
        if (!findText(text, sources))
            warnings.push(
                `${where}: text ${JSON.stringify(text)} not found in native messages or source`,
            );
    }

    return { errors, warnings, flows };
};

// ---------------------------------------------------------------------------
// flow-checks.json references (used by verify.ts)
// ---------------------------------------------------------------------------

type CheckImage = { screenshotId: string; device: string; image: string; preferred: boolean };

/** Existing captures of a flow's screenshot: the base capture and its device variants. */
const checkImages = (root: string, manifest: Manifest, flows: Flow[]): CheckImage[] => {
    const images: CheckImage[] = [];
    for (const flow of flows) {
        const id = flow.screenshot_id;
        const base = manifest.screenshots.get(id);
        if (base && fs.existsSync(nodePath.join(root, base))) {
            images.push({
                screenshotId: id,
                device: manifest.baseDevice.get(id) ?? 'unknown',
                image: base,
                preferred: false,
            });
        }
        for (const variant of manifest.variants.filter(v => v.screenshotId === id)) {
            if (!fs.existsSync(nodePath.join(root, variant.image))) continue;
            images.push({
                screenshotId: id,
                device: variant.device,
                image: variant.image,
                preferred: variant.device === manifest.preferredDevice,
            });
        }
    }

    const compare = (a: string, b: string) => {
        if (a < b) return -1;

        return a > b ? 1 : 0;
    };

    return images.sort((a, b) =>
        a.screenshotId === b.screenshotId
            ? compare(a.image, b.image)
            : compare(a.screenshotId, b.screenshotId),
    );
};

/** Reference checks of runtime/flow-checks.json against the flows and existing captures. */
export const checkFlowChecksReferences = (root: string, flows: Flow[]): string[] => {
    const errors: string[] = [];
    const path = nodePath.join(root, FLOW_CHECKS_JSON);
    if (!fs.existsSync(path))
        return [`${FLOW_CHECKS_JSON} is missing; run node capture-flows.ts check`];
    const data = readJsonFile(path) as {
        generated_by?: unknown;
        tesseract_version?: unknown;
        checks?: unknown;
    };
    if (data.generated_by !== GENERATED_BY)
        errors.push(`${FLOW_CHECKS_JSON}: generated_by must be "${GENERATED_BY}"`);
    if (typeof data.tesseract_version !== 'string' || !data.tesseract_version)
        errors.push(`${FLOW_CHECKS_JSON}: tesseract_version missing`);
    if (!Array.isArray(data.checks))
        return [...errors, `${FLOW_CHECKS_JSON}: checks must be a list`];
    const byId = new Map(flows.map(flow => [flow.screenshot_id, flow]));
    const expected = new Map(
        checkImages(root, readManifest(root), flows).map(image => [
            `${image.screenshotId} ${image.image}`,
            image,
        ]),
    );
    const seen = new Set<string>();
    for (const [index, raw] of (data.checks as unknown[]).entries()) {
        const where = `${FLOW_CHECKS_JSON} checks[${index}]`;
        if (!isPlain(raw)) {
            errors.push(`${where}: not an object`);
            continue;
        }
        const check = raw as Partial<LandingCheck>;
        const flow = byId.get(check.screenshot_id ?? '');
        if (!flow) {
            errors.push(`${where}: unknown screenshot_id ${String(check.screenshot_id)}`);
            continue;
        }
        const key = `${check.screenshot_id} ${check.image}`;
        const image = expected.get(key);
        if (!image) {
            errors.push(
                `${where}: image ${String(check.image)} is not a capture of ${check.screenshot_id}`,
            );
            continue;
        }
        if (seen.has(key)) errors.push(`${where}: duplicate check`);
        seen.add(key);
        if (check.sha256 !== sha256Of(nodePath.join(root, image.image)))
            errors.push(
                `${where}: ${image.image} changed after its landing check (stale; rerun check)`,
            );
        if (check.device !== image.device)
            errors.push(`${where}: device ${String(check.device)} != ${image.device}`);
        const found = Array.isArray(check.found) ? check.found : [];
        const missing = Array.isArray(check.missing) ? check.missing : [];
        const landmarks = [...flow.arrival.landmarks].sort();
        if (JSON.stringify([...found, ...missing].sort()) !== JSON.stringify(landmarks))
            errors.push(
                `${where}: found + missing differ from the flow landmarks (stale; rerun check)`,
            );
        if (check.result !== (missing.length ? 'drift' : 'pass'))
            errors.push(
                `${where}: result ${String(check.result)} disagrees with missing landmarks`,
            );
    }
    for (const key of expected.keys()) {
        if (!seen.has(key))
            errors.push(`${FLOW_CHECKS_JSON}: no check for ${key} (stale; rerun check)`);
    }
    const order = (data.checks as LandingCheck[]).map(c => `${c.screenshot_id} ${c.image}`);
    if (order.some((key, index) => index > 0 && key < order[index - 1]))
        errors.push(`${FLOW_CHECKS_JSON}: checks are not sorted`);

    return errors;
};

/** verify.ts entry point: static validation plus flow-checks.json references; throws on failure. */
export const verifyCaptureFlows = (root: string = FEATURE_MAP_DIR) => {
    const result = validateCaptureFlows(root);
    const errors = [...result.errors];
    if (!errors.length) errors.push(...checkFlowChecksReferences(root, result.flows));
    if (errors.length) {
        throw new Error(`Capture flows failed verification:\n  ${errors.join('\n  ')}`);
    }
    const { checks } = readJsonFile(nodePath.join(root, FLOW_CHECKS_JSON)) as {
        checks: LandingCheck[];
    };

    return {
        flows: result.flows.length,
        landing_checks: checks.length,
        landing_drift: checks.filter(check => check.result === 'drift').length,
    };
};

// ---------------------------------------------------------------------------
// check (OCR landing check)
// ---------------------------------------------------------------------------

const findTesseract = (): string => {
    const candidates = [process.env.TESSERACT, 'tesseract'].filter((c): c is string => !!c);
    for (const candidate of candidates) {
        try {
            execFileSync(candidate, ['--version'], { stdio: 'ignore' });

            return candidate;
        } catch {
            // try the next candidate
        }
    }
    throw new Error('tesseract not found: install it or set TESSERACT=/path/to/tesseract');
};

/** Lowercase, unify apostrophes, drop punctuation and symbols, collapse whitespace. */
export const normaliseOcr = (text: string): string =>
    text
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[\p{P}\p{S}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Normalised text of an image from every OCR pass of the replay driver (OCR_PASSES); each pass
 * reads some UI labels the others miss, so a landmark found by any of them counts.
 */
const ocrText = (tesseract: string, image: string): string =>
    OCR_PASSES.map(pass =>
        normaliseOcr(
            execFileSync(tesseract, [image, '-', ...pass], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            }),
        ),
    ).join(' | ');

/**
 * A landmark matches as whole words. A single-word landmark of 4+ characters may also match
 * inside a longer OCR token, because OCR glues adjacent words and icons ("Bitcoin Cash" next to
 * its icon reads as "sitcoincash").
 */
const containsLandmark = (normalisedText: string, landmark: string): boolean => {
    const needle = normaliseOcr(landmark);
    if (!needle.length) return false;
    if (` ${normalisedText} `.includes(` ${needle} `)) return true;

    return (
        !needle.includes(' ') &&
        needle.length >= 4 &&
        normalisedText.split(' ').some(token => token.includes(needle))
    );
};

const runCheck = (root: string): number => {
    const validation = validateCaptureFlows(root);
    if (validation.errors.length) {
        process.stderr.write(
            `Static validation failed; fix it before the landing check:\n  ${validation.errors.join('\n  ')}\n`,
        );

        return 1;
    }
    const tesseract = findTesseract();
    const version = execFileSync(tesseract, ['--version'], { encoding: 'utf8' })
        .split('\n')[0]
        .trim();
    const byId = new Map(validation.flows.map(flow => [flow.screenshot_id, flow]));
    const images = checkImages(root, readManifest(root), validation.flows);
    const checks: LandingCheck[] = [];
    const preferredDrift: string[] = [];
    for (const image of images) {
        const text = ocrText(tesseract, nodePath.join(root, image.image));
        const { landmarks } = (byId.get(image.screenshotId) as Flow).arrival;
        const found = landmarks.filter(landmark => containsLandmark(text, landmark));
        const missing = landmarks.filter(landmark => !found.includes(landmark));
        const result = missing.length ? 'drift' : 'pass';
        checks.push({
            screenshot_id: image.screenshotId,
            image: image.image,
            device: image.device,
            found,
            missing,
            result,
            sha256: sha256Of(nodePath.join(root, image.image)),
        });
        if (result === 'drift' && image.preferred)
            preferredDrift.push(`${image.image}: missing ${missing.join(', ')}`);
    }
    dumpJson(nodePath.join(root, FLOW_CHECKS_JSON), {
        generated_by: GENERATED_BY,
        tesseract_version: version,
        checks,
    });
    const drift = checks.filter(check => check.result === 'drift');
    process.stdout.write(
        `${FLOW_CHECKS_JSON}: ${checks.length} checks, ${checks.length - drift.length} pass, ${drift.length} drift\n`,
    );
    for (const check of drift)
        process.stdout.write(
            `  drift ${check.image} (${check.device}): missing ${check.missing.join(', ')}\n`,
        );
    if (preferredDrift.length) {
        process.stderr.write(
            `Landing check drifted on the preferred device:\n  ${preferredDrift.join('\n  ')}\n`,
        );

        return 1;
    }

    return 0;
};

const optionValue = (args: string[], name: string): string | undefined => {
    const index = args.indexOf(name);
    if (index === -1) return undefined;
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    args.splice(index, 2);

    return value;
};

type DeviceVariant = { variant_of: string; device: string; path: string; captured_at: string };

/**
 * Replays flows on the device bound to `--agent-device` and records the outcome in
 * parts/capture-flows.json. `--start-state` selects the flows (default onboarded-empty); with
 * `--setup`, that state's setup steps run first, after the caller prepared a fresh install.
 * Arrival screenshots go to a temporary work directory. With `--update-captures`, the arrival
 * screenshot of every flow that passed replay and landing check replaces that flow's capture for
 * the replay device in parts/runtime-device-variants.json, and its `captured_at` is updated.
 */
const runReplay = (root: string, args: string[]): number => {
    const rest = [...args];
    const agentDevice = optionValue(rest, '--agent-device');
    if (!agentDevice)
        throw new Error('replay requires --agent-device <path to the agent-device CLI>');
    const flowsPath = nodePath.join(root, FLOWS_JSON);
    const data = readJsonFile(flowsPath) as CaptureFlows;
    const device = optionValue(rest, '--device') ?? data.recorded_on;
    const startState = optionValue(rest, '--start-state') ?? 'onboarded-empty';
    const takeFlag = (name: string): boolean => {
        const index = rest.indexOf(name);
        if (index !== -1) rest.splice(index, 1);

        return index !== -1;
    };
    const runSetup = takeFlag('--setup');
    const updateCaptures = takeFlag('--update-captures');
    const unknownFlag = rest.find(arg => arg.startsWith('--'));
    if (unknownFlag) throw new Error(`unknown replay option ${unknownFlag}`);
    const state = data.start_states[startState];
    if (!state) throw new Error(`unknown start state ${startState}`);
    const flows = data.flows.filter(
        flow =>
            flow.steps.length &&
            flow.start_state === startState &&
            (!rest.length || rest.includes(flow.screenshot_id)),
    );
    const unknownIds = rest.filter(id => !data.flows.some(flow => flow.screenshot_id === id));
    if (unknownIds.length) throw new Error(`unknown flows: ${unknownIds.join(', ')}`);
    const variantsPath = nodePath.join(root, VARIANTS_JSON);
    const variantsFile = readJsonFile(variantsPath) as { variants: DeviceVariant[] };
    const variantOf = (id: string) =>
        variantsFile.variants.find(
            variant => variant.variant_of === id && variant.device === device,
        );
    if (updateCaptures) {
        const missing = flows.filter(flow => !variantOf(flow.screenshot_id));
        if (missing.length)
            throw new Error(
                `--update-captures: no ${device} variant in ${VARIANTS_JSON} for ` +
                    missing.map(flow => flow.screenshot_id).join(', '),
            );
    }
    const tesseract = findTesseract();
    const workDir = fs.mkdtempSync(nodePath.join(os.tmpdir(), 'capture-flows-'));
    const options = {
        agentDevice,
        appId: data.app_id,
        tesseract,
        workDir,
        pixelDensity: 3,
        log: (message: string) => process.stdout.write(`${message}\n`),
    };
    if (runSetup) {
        const setup = replayFlow(
            options,
            `setup-${startState}`,
            state.setup,
            nodePath.join(workDir, 'setup.png'),
        );
        if (setup.result !== 'pass')
            throw new Error(`setup for ${startState} failed: ${setup.note}`);
    }
    let failures = 0;
    let updated = 0;
    for (const flow of flows) {
        const image = nodePath.join(workDir, `${flow.screenshot_id}.png`);
        const outcome = replayFlow(options, flow.screenshot_id, flow.steps, image);
        let landing = 'not-run';
        let { note } = outcome;
        if (outcome.result === 'pass') {
            const text = ocrText(tesseract, image);
            const missing = flow.arrival.landmarks.filter(
                landmark => !containsLandmark(text, landmark),
            );
            landing = missing.length ? 'drift' : 'pass';
            if (missing.length) note = `missing landmarks: ${missing.join(', ')}`;
        }
        const date = new Date().toISOString();
        const replay = { device, date, result: outcome.result, landing, note };
        flow.replays = [...flow.replays.filter(entry => entry.device !== device), replay];
        flow.status = outcome.result === 'pass' && landing === 'pass' ? 'replayed' : 'drifted';
        if (flow.status === 'drifted') failures++;
        const variant = variantOf(flow.screenshot_id);
        if (updateCaptures && variant && flow.status === 'replayed') {
            fs.copyFileSync(image, nodePath.join(REPO_ROOT, variant.path));
            variant.captured_at = date.replace(/\.\d+Z$/, '+00:00');
            dumpJson(variantsPath, variantsFile);
            updated++;
        }
        process.stdout.write(
            `${flow.screenshot_id}: ${outcome.result}, landing ${landing}${note ? ` (${note})` : ''}\n`,
        );
        dumpJson(flowsPath, data);
    }
    process.stdout.write(
        `${flows.length} flows replayed on ${device}, ${failures} drifted` +
            `${updateCaptures ? `, ${updated} captures updated` : ''}\n` +
            `${updated ? 'replaced captures invalidate their landing checks; run `check` again\n' : ''}` +
            `arrival and step screenshots: ${workDir}\n`,
    );

    return failures ? 1 : 0;
};

const runValidate = (root: string): number => {
    const result = validateCaptureFlows(root);
    const statuses = new Map<string, number>();
    for (const flow of result.flows)
        statuses.set(flow.status, (statuses.get(flow.status) ?? 0) + 1);
    for (const warning of result.warnings) process.stderr.write(`warning: ${warning}\n`);
    for (const error of result.errors) process.stderr.write(`error: ${error}\n`);
    process.stdout.write(
        `${result.errors.length ? 'FAIL' : 'PASS'}: ${result.flows.length} flows, ` +
            `${
                [...statuses]
                    .sort()
                    .map(([status, count]) => `${status}=${count}`)
                    .join(' ') || 'no statuses'
            }, ` +
            `${result.errors.length} errors, ${result.warnings.length} warnings\n`,
    );

    return result.errors.length ? 1 : 0;
};

if (isMain(import.meta.filename)) {
    const { root, rest } = parseRoot(process.argv.slice(2));
    const [command = 'validate', ...extra] = rest;
    if (
        (extra.length && command !== 'replay') ||
        !['validate', 'check', 'replay'].includes(command)
    ) {
        process.stderr.write(
            'usage: node capture-flows.ts [validate|check] [--root <feature-map-dir>]\n' +
                '       node capture-flows.ts replay --agent-device <cli> [--device <name>] [--start-state <state>] [--setup] [--update-captures] [ids...]\n',
        );
        process.exit(2);
    }
    try {
        if (command === 'replay') process.exit(runReplay(root, extra));
        process.exit(command === 'check' ? runCheck(root) : runValidate(root));
    } catch (error) {
        process.stderr.write(`error: ${(error as Error).message}\n`);
        process.exit(1);
    }
}
