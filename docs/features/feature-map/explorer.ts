// Builds the offline interactive feature explorer (explorer.html) from features.json.

import * as nodePath from 'node:path';

import {
    FEATURE_MAP_DIR,
    PyFloat,
    PyKeyError,
    REPO_ROOT,
    hasKey,
    isMain,
    pyAssert,
    pyCompareStrings,
    pyConcat,
    pyEquals,
    pyExists,
    pyExit,
    pyIn,
    pyIsFile,
    pyIsRelativeTo,
    pyJoin,
    pyJsonDumps,
    pyKeys,
    pyParseNoArgs,
    pyRelativeTo,
    pyResolve,
    pySetKey,
    pySorted,
    pyStr,
    pyStrJoin,
    pySuffix,
    readJson,
    readText,
    writeText,
} from './pylib.ts';
import type { Json, JsonObject } from './pylib.ts';

const DOC = `Build the offline interactive feature explorer (explorer.html) from features.json.

The explorer embeds a compact projection of the canonical dataset plus derived
cross-links between features (explicit relations, shared screens, shared root
components and shared test scenarios). Run from any directory:

    node docs/features/feature-map/explorer.ts
`;

const HERE = FEATURE_MAP_DIR;
const AXES = [
    'desktop_automated',
    'android_automated',
    'desktop_manual',
    'android_manual',
] as const;
// Groups larger than this describe broad scenarios or shells; linking every pair adds noise.
export const MAX_SHARED_GROUP = 12;
// Test evidence that counts as an exercised verification step for "shared test" links.
const ACTIVE_EXECUTIONS = new Set<Json>(['active', 'manual-procedure']);

type ById = Map<string, JsonObject>;
type ScreensByFeature = Map<string, string[]>;

// Python truthiness for JSON values.
const truthy = (value: Json | undefined): boolean => {
    if (value === null || value === undefined) return false;
    if (value instanceof PyFloat) return value.value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return pyKeys(value).length > 0;

    return Boolean(value);
};

// dict.get(key) -> value or None
const get = (obj: JsonObject, key: string): Json => (hasKey(obj, key) ? obj[key] : null);

// dict[key] -> raises KeyError when missing
const req = (obj: JsonObject, key: string): Json => {
    if (!hasKey(obj, key)) throw new PyKeyError(key);

    return obj[key];
};

const reqObj = (obj: JsonObject, key: string): JsonObject => req(obj, key) as JsonObject;
const reqStr = (obj: JsonObject, key: string): string => req(obj, key) as string;

// `x or {}` / `x or []`
const orObj = (value: Json): JsonObject => (truthy(value) ? (value as JsonObject) : {});
const orList = (value: Json): Json[] => (truthy(value) ? (value as Json[]) : []);

const byIdGet = (byId: ById, key: string): JsonObject => {
    const value = byId.get(key);
    if (value === undefined) throw new PyKeyError(key);

    return value;
};

const listContains = (list: Json, value: Json): boolean =>
    (list as Json[]).some(item => pyEquals(item, value));

const isAncestorPair = (byId: ById, a: string, b: string): boolean =>
    listContains(req(byIdGet(byId, b), 'path_ids'), a) ||
    listContains(req(byIdGet(byId, a), 'path_ids'), b);

const compactLink = (item: JsonObject): JsonObject => {
    const result: JsonObject = {};
    for (const key of ['path', 'line', 'github_url', 'local_link']) {
        if (get(item, key) !== null) result[key] = item[key];
    }

    return result;
};

const rootLabel = (root: JsonObject): string =>
    pyConcat(req(root, 'path'), truthy(get(root, 'symbol')) ? pyConcat(' · ', root.symbol) : '');

/**
 * Return undirected feature-to-feature links keyed by type.
 *
 * - related: explicit related_ids in the inventory.
 * - screen: both features are visible on one runtime screenshot (errata-corrected scope).
 * - component: a dedicated root component is shared; containers inherited from a common
 *   ancestor and siblings under one parent are skipped because the tree already shows them.
 * - test: one active test scenario (same file:line and axis kind) is cited as evidence for a
 *   non-zero score of both features; siblings are skipped for the same reason.
 */
export const deriveLinks = (
    features: JsonObject[],
    byId: ById,
    screensByFeature: ScreensByFeature,
): JsonObject[] => {
    const links = new Map<string, JsonObject>();

    const add = (a: string, b: string, kind: string, label: string) => {
        if (a === b || isAncestorPair(byId, a, b)) return;
        const low = pyCompareStrings(a, b) <= 0 ? a : b;
        const high = pyCompareStrings(a, b) >= 0 ? a : b;
        const key = JSON.stringify([low, high, kind]);
        let entry = links.get(key);
        if (entry === undefined) {
            entry = { a: low, b: high, type: kind, via: [] };
            links.set(key, entry);
        }
        const via = entry.via as Json[];
        if (!via.includes(label) && via.length < 6) via.push(label);
    };

    const ancestorRoots = (featureId: string): Set<string> => {
        const labels = new Set<string>();
        for (const pid of (req(byIdGet(byId, featureId), 'path_ids') as string[]).slice(0, -1)) {
            for (const r of orList(get(byIdGet(byId, pid), 'roots')))
                labels.add(rootLabel(r as JsonObject));
        }

        return labels;
    };

    for (const feature of features) {
        for (const other of orList(get(feature, 'related_ids'))) {
            if (typeof other === 'string' && byId.has(other)) {
                add(reqStr(feature, 'id'), other, 'related', 'Explicit cross-reference');
            }
        }
    }

    const groups = new Map<string, Map<string, Set<string>>>([
        ['screen', new Map()],
        ['component', new Map()],
        ['test', new Map()],
    ]);
    const addToGroup = (kind: string, label: string, fid: string) => {
        const grouped = groups.get(kind)!;
        let members = grouped.get(label);
        if (members === undefined) {
            members = new Set();
            grouped.set(label, members);
        }
        members.add(fid);
    };
    for (const feature of features) {
        const fid = reqStr(feature, 'id');
        for (const shotId of screensByFeature.get(fid) ?? []) addToGroup('screen', shotId, fid);
        const inherited = ancestorRoots(fid);
        for (const root of orList(get(feature, 'roots'))) {
            const label = rootLabel(root as JsonObject);
            if (!inherited.has(label)) addToGroup('component', label, fid);
        }
        for (const axis of AXES) {
            const item = orObj(get(orObj(get(feature, 'test_coverage')), axis));
            if (!truthy(get(item, 'score'))) continue;
            const kind = axis.endsWith('_manual') ? 'manual' : 'automated';
            for (const evidenceValue of orList(get(item, 'evidence'))) {
                const evidence = evidenceValue as JsonObject;
                if (!ACTIVE_EXECUTIONS.has(get(evidence, 'execution'))) continue;
                const line = get(evidence, 'line');
                addToGroup(
                    'test',
                    `${pyStr(req(evidence, 'path'))}:${pyStr(truthy(line) ? line : 1)} (${kind})`,
                    fid,
                );
            }
        }
    }

    for (const [kind, grouped] of groups) {
        for (const [label, members] of grouped) {
            if (members.size > MAX_SHARED_GROUP) continue;
            const ordered = pySorted(members);
            ordered.forEach((a, i) => {
                for (const b of ordered.slice(i + 1)) {
                    if (
                        kind !== 'screen' &&
                        pyEquals(
                            req(byIdGet(byId, a), 'parent_id'),
                            req(byIdGet(byId, b), 'parent_id'),
                        )
                    ) {
                        continue;
                    }
                    add(a, b, kind, label);
                }
            });
        }
    }

    return pySorted(links.values(), link => [link.a, link.b, link.type]);
};

// Hash key for the (kind, path, line) tuple; numbers equal under Python == share a key.
const tupleKey = (items: Json[]): string =>
    JSON.stringify(
        items.map(item => {
            if (item instanceof PyFloat) return ['n', item.value];
            if (typeof item === 'number' || typeof item === 'boolean') return ['n', Number(item)];
            if (typeof item === 'bigint') return ['n', item.toString()];

            return ['v', item];
        }),
    );

const pick = (obj: JsonObject, keys: readonly string[]): JsonObject => {
    const result: JsonObject = {};
    for (const key of keys) result[key] = get(obj, key);

    return result;
};

export const projectFeature = (
    feature: JsonObject,
    byId: ById,
    screensByFeature: ScreensByFeature,
    supersededObservations: Set<Json>,
): JsonObject => {
    const coverage: JsonObject = {};
    for (const axis of AXES) {
        const itemValue = get(orObj(get(feature, 'test_coverage')), axis);
        if (!truthy(itemValue)) {
            coverage[axis] = {
                score: null,
                confidence: null,
                applicability: 'unassessed',
                basis: null,
                rationale: 'No test-quality assessment recorded for this feature yet.',
                covered: [],
                gaps: [],
                evidence: [],
            };
            continue;
        }
        const item = itemValue as JsonObject;
        coverage[axis] = {
            score: req(item, 'score'),
            confidence: req(item, 'confidence'),
            applicability: req(item, 'applicability'),
            basis: req(item, 'basis'),
            rationale: req(item, 'rationale'),
            covered: orList(get(item, 'covered_intents')),
            gaps: orList(get(item, 'gaps')),
            evidence: orList(get(item, 'evidence')).map(value => {
                const e = value as JsonObject;

                return {
                    ...compactLink(e),
                    scenario: get(e, 'scenario'),
                    verification: get(e, 'verification'),
                    execution: get(e, 'execution'),
                };
            }),
        };
    }
    const merged = new Map<string, JsonObject>();
    for (const value of orList(get(feature, 'evidence'))) {
        const e = value as JsonObject;
        const key = tupleKey([req(e, 'kind'), req(e, 'path'), get(e, 'line')]);
        const existing = merged.get(key);
        if (existing === undefined) {
            merged.set(key, { ...compactLink(e), kind: e.kind, detail: get(e, 'detail') });
        } else if (
            truthy(get(e, 'detail')) &&
            !pyIn(e.detail, truthy(existing.detail) ? existing.detail : '')
        ) {
            existing.detail = pyStrJoin(' · ', [existing.detail, e.detail].filter(truthy));
        }
    }
    const ownership = orObj(get(feature, 'ownership'));
    const featureId = reqStr(feature, 'id');
    const pathIds = truthy(get(feature, 'path_ids')) ? (feature.path_ids as string[]) : [featureId];

    return {
        id: featureId,
        parent: req(feature, 'parent_id'),
        name: req(feature, 'name'),
        description: req(feature, 'description'),
        level: req(feature, 'level'),
        depth: req(feature, 'depth'),
        order: hasKey(feature, 'order') ? feature.order : 0,
        scope: hasKey(feature, 'scope') ? feature.scope : 'user-facing',
        breadcrumb: pathIds
            .filter(pid => byId.has(pid))
            .map(pid => req(byIdGet(byId, pid), 'name')),
        platforms: req(feature, 'platforms'),
        platform_notes: get(feature, 'platform_notes'),
        navigation: req(feature, 'navigation'),
        navigation_alternatives: orObj(get(feature, 'navigation_alternatives')),
        conditions: orObj(get(feature, 'conditions_by_platform')),
        ownership,
        team: req(ownership, 'team'),
        backend_team: req(ownership, 'backend_team'),
        roots: orList(get(feature, 'roots')).map(value => {
            const r = value as JsonObject;

            return {
                ...compactLink(r),
                symbol: get(r, 'symbol'),
                platform: req(r, 'platform'),
                role: req(r, 'role'),
                codeowners: get(r, 'codeowners'),
                supported_platforms: get(r, 'supported_platforms'),
            };
        }),
        screens: screensByFeature.get(featureId) ?? [],
        historical_screenshot:
            get(orObj(get(feature, 'screenshot')), 'status') === 'existing-historical'
                ? req(feature, 'screenshot')
                : null,
        observations: orList(get(feature, 'runtime_observations')).map(value => {
            const o = value as JsonObject;

            return {
                ...pick(o, [
                    'id',
                    'platform',
                    'model',
                    'firmware',
                    'navigation',
                    'description',
                    'conditions',
                ]),
                superseded: supersededObservations.has(get(o, 'id')),
            };
        }),
        errata: orList(get(feature, 'runtime_errata')).map(value => {
            const e = value as JsonObject;

            return {
                ...pick(e, ['observation_id', 'screenshot_id', 'description', 'reason']),
                removes_this_feature: !listContains(orList(get(e, 'feature_ids')), featureId),
            };
        }),
        variants: orList(get(feature, 'variants')).map(v =>
            pick(v as JsonObject, [
                'source_id',
                'platform',
                'name',
                'description',
                'platform_notes',
            ]),
        ),
        parity: orList(get(feature, 'parity_audit')).map(item =>
            pick(item as JsonObject, ['platform', 'status', 'reason']),
        ),
        coverage,
        evidence: [...merged.values()],
    };
};

/**
 * Label captures with their simulator and add the same screens captured on other devices.
 *
 * The runtime manifest is frozen by the test-coverage baseline, so device labels and
 * re-captures live in a separate explorer-only manifest. A variant shows exactly the
 * features of its base capture; the explorer shows one variant per screen at a time.
 */
export const applyDeviceVariants = (
    screens: JsonObject,
    screensByFeature: ScreensByFeature,
): Json[] => {
    const path = pyJoin(HERE, 'parts/runtime-device-variants.json');
    if (!pyExists(path)) return [];
    const manifest = readJson(path) as JsonObject;
    const root = pyResolve(pyJoin(HERE, 'runtime/screenshots'));
    for (const groupValue of req(manifest, 'base_devices') as Json[]) {
        const group = groupValue as JsonObject;
        for (const shotIdValue of req(group, 'screenshot_ids') as Json[]) {
            const shotId = shotIdValue as string;
            pyAssert(hasKey(screens, shotId), ['Device label for an unknown screenshot', shotId]);
            const screen = screens[shotId] as JsonObject;
            pyAssert(pyEquals(req(screen, 'platform'), req(group, 'platform')), [
                'Device label on another platform',
                shotId,
            ]);
            screen.device = req(group, 'device');
        }
    }
    for (const variantValue of req(manifest, 'variants') as Json[]) {
        const variant = variantValue as JsonObject;
        const required = [
            'id',
            'variant_of',
            'device',
            'path',
            'caption',
            'fixture_context',
            'captured_at',
        ];
        pyAssert(
            required.every(key => hasKey(variant, key)),
            ['Incomplete device variant', get(variant, 'id')],
        );
        const variantId = variant.id as string;
        const variantOf = variant.variant_of as string;
        pyAssert(!hasKey(screens, variantId), ['Duplicate screenshot ID', variantId]);
        const base = hasKey(screens, variantOf) ? (screens[variantOf] as JsonObject) : null;
        pyAssert(base !== null && truthy(base) && pyEquals(req(base, 'group'), variantOf), [
            'Device variant needs a base capture',
            variantId,
        ]);
        const siblings = pyKeys(screens)
            .map(key => screens[key] as JsonObject)
            .filter(s => pyEquals(req(s, 'group'), variantOf));
        pyAssert(!siblings.some(s => pyEquals(get(s, 'device'), variant.device)), [
            'Second capture of a screen on one device',
            variantId,
        ]);
        const full = pyResolve(pyJoin(REPO_ROOT, variant.path as string));
        pyAssert(
            pyIsRelativeTo(full, root) && pySuffix(full).toLowerCase() === '.png' && pyIsFile(full),
            ['Missing variant PNG', variant.path],
        );
        pySetKey(screens, variantId, {
            ...base,
            src: pyRelativeTo(full, HERE),
            device: variant.device,
            caption: variant.caption,
            context: variant.fixture_context,
        });
        for (const fidValue of req(base, 'features') as Json[]) {
            const fid = fidValue as string;
            let ids = screensByFeature.get(fid);
            if (ids === undefined) {
                ids = [];
                screensByFeature.set(fid, ids);
            }
            const index = ids.indexOf(variantOf);
            if (index < 0) throw new Error(`ValueError: '${variantOf}' is not in list`);
            ids.splice(index + 1, 0, variantId);
        }
    }

    return truthy(get(manifest, 'preferred_device')) ? [manifest.preferred_device] : [];
};

/**
 * Replayable capture flows of the native mobile screenshots, keyed by base screenshot ID.
 *
 * parts/capture-flows.json is read as it is at build time (device replays update it), and
 * runtime/flow-checks.json adds OCR landing checks per captured image when it exists.
 */
export const loadCaptureFlows = (screens: JsonObject): JsonObject | null => {
    const path = pyJoin(HERE, 'parts/capture-flows.json');
    if (!pyExists(path)) return null;
    const manifest = readJson(path) as JsonObject;
    const startStates: JsonObject = {};
    const states = reqObj(manifest, 'start_states');
    for (const key of pyKeys(states)) {
        const state = states[key] as JsonObject;
        const prepare = get(state, 'prepare');
        startStates[key] = prepare
            ? `${req(state, 'description') as string} Prepare: ${prepare as string}`
            : req(state, 'description');
    }
    const checksPath = pyJoin(HERE, 'runtime/flow-checks.json');
    const checksData = pyExists(checksPath) ? (readJson(checksPath) as JsonObject) : null;
    const checksById = new Map<string, Json[]>();
    for (const value of checksData ? orList(get(checksData, 'checks')) : []) {
        const check = value as JsonObject;
        const shotId = reqStr(check, 'screenshot_id');
        if (!checksById.has(shotId)) checksById.set(shotId, []);
        checksById
            .get(shotId)!
            .push(pick(check, ['image', 'device', 'result', 'found', 'missing']));
    }
    const flows: JsonObject = {};
    for (const value of req(manifest, 'flows') as Json[]) {
        const flow = value as JsonObject;
        const shotId = reqStr(flow, 'screenshot_id');
        if (!hasKey(screens, shotId)) continue;
        const replays = orList(get(flow, 'replays'));
        pySetKey(flows, shotId, {
            start_state: req(flow, 'start_state'),
            steps: req(flow, 'steps'),
            arrival: req(flow, 'arrival'),
            status: req(flow, 'status'),
            note: get(flow, 'note'),
            replay_count: replays.length,
            latest_replay: replays.length ? replays[replays.length - 1] : null,
            checks: checksById.get(shotId) ?? [],
        });
    }

    return {
        start_states: startStates,
        tesseract_version: checksData ? get(checksData, 'tesseract_version') : null,
        flows,
    };
};

export const buildExplorer = (): JsonObject => {
    const dataset = readJson(pyJoin(HERE, 'features.json')) as JsonObject;
    const features = req(dataset, 'features') as JsonObject[];
    const byId: ById = new Map();
    for (const f of features) byId.set(reqStr(f, 'id'), f);
    const screens: JsonObject = {};
    const screensByFeature: ScreensByFeature = new Map();
    const runtime = reqObj(dataset, 'runtime');
    for (const shotValue of req(runtime, 'screenshots') as Json[]) {
        const shot = shotValue as JsonObject;
        const scope = (
            hasKey(shot, 'effective_feature_ids')
                ? shot.effective_feature_ids
                : req(shot, 'feature_ids')
        ) as Json[];
        const effective = scope.filter(
            (fid): fid is string => typeof fid === 'string' && byId.has(fid),
        );
        if (!effective.length) continue;
        const shotId = reqStr(shot, 'id');
        pySetKey(screens, shotId, {
            src: req(shot, 'explorer_path'),
            platform: req(shot, 'platform'),
            model: get(shot, 'model'),
            firmware: get(shot, 'firmware'),
            device: null,
            group: shotId,
            caption: req(shot, 'caption'),
            context: get(shot, 'fixture_context'),
            features: effective,
        });
        for (const fid of effective) {
            let ids = screensByFeature.get(fid);
            if (ids === undefined) {
                ids = [];
                screensByFeature.set(fid, ids);
            }
            ids.push(shotId);
        }
    }
    const preferredDevices = applyDeviceVariants(screens, screensByFeature);
    const superseded = new Set<Json>(
        orList(get(runtime, 'errata')).map(e => get(e as JsonObject, 'observation_id')),
    );
    const metadata = reqObj(dataset, 'metadata');
    const meta: JsonObject = {};
    for (const key of [
        'title',
        'audit_date',
        'repository',
        'commit',
        'published_reference_base',
        'verification',
    ]) {
        meta[key] = req(metadata, key);
    }
    const payload: JsonObject = {
        meta,
        statistics: req(dataset, 'statistics'),
        rubric: req(reqObj(dataset, 'test_coverage_audit'), 'rubric'),
        features: features.map(f => projectFeature(f, byId, screensByFeature, superseded)),
        screens,
        preferred_devices: preferredDevices,
        links: deriveLinks(features, byId, screensByFeature),
        max_shared_group: MAX_SHARED_GROUP,
        capture_flows: loadCaptureFlows(screens),
    };
    const packed = pyJsonDumps(payload, { ensureAscii: false, separators: [',', ':'] })
        .split('</')
        .join('<\\/');
    const template = readText(pyJoin(HERE, 'explorer.template.html'));
    if (!template.includes('__FEATURE_DATA__')) {
        pyExit('explorer.template.html is missing the __FEATURE_DATA__ placeholder');
    }
    writeText(pyJoin(HERE, 'explorer.html'), template.split('__FEATURE_DATA__').join(packed));

    return payload;
};

if (isMain(import.meta.filename)) {
    pyParseNoArgs(nodePath.basename(process.argv[1]), DOC);
    const result = buildExplorer();
    process.stdout.write(
        `explorer.html: ${(result.features as Json[]).length} features, ${pyKeys(result.screens as JsonObject).length} screens, ${(result.links as Json[]).length} links\n`,
    );
}
