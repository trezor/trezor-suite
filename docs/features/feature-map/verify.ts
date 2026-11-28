// Check feature-map references and cross-format integrity using Node built-ins only.

import { stripTypeScriptTypes } from 'node:module';
import * as nodePath from 'node:path';

import {
    checkAdditiveBaseline,
    readRuntime,
    readSourceAdditions,
    screenshotFile,
} from './build.ts';
import { verifyCaptureFlows } from './capture-flows.ts';
import { AXES, preserveBaseline } from './coverage.ts';
import { buildExplorerPayload } from './explorer.ts';
import {
    FEATURE_MAP_DIR,
    PyFloat,
    PyKeyError,
    REPO_ROOT,
    hasKey,
    isMain,
    isPlainObject,
    pyAssert,
    pyCompare,
    pyCsvDictReader,
    pyDecodeUtf8,
    pyEntries,
    pyEquals,
    pyExists,
    pyFindall,
    pyInt,
    pyIsAbsolute,
    pyIsFile,
    pyJoin,
    pyJsonDumps,
    pyJsonLoads,
    pyKeys,
    pyMatch,
    pyPathParts,
    pyRe,
    pyRelativeTo,
    pyRglob,
    pySorted,
    pyStr,
    pyStrip,
    readBytes,
    readJson,
    readText,
    sha256File,
    splitlines,
    xmlFindAll,
    xmlParse,
} from './pylib.ts';
import type { Json, JsonObject } from './pylib.ts';

const HERE = FEATURE_MAP_DIR;
const REPO = REPO_ROOT;

/** Results of the build/coverage helpers are JSON values. */
const json = (value: unknown): Json => value as Json;

const typeName = (value: unknown): string => {
    if (value === null || value === undefined) return 'NoneType';
    if (typeof value === 'string') return 'str';
    if (typeof value === 'boolean') return 'bool';
    if (typeof value === 'number' || typeof value === 'bigint') return 'int';
    if (value instanceof PyFloat) return 'float';
    if (Array.isArray(value)) return 'list';

    return 'dict';
};

/** container[key] for dicts (KeyError when missing) and lists (negative indexes allowed). */
const at = (container: unknown, ...keys: (string | number)[]): Json => {
    let value = container;
    for (const key of keys) {
        if (Array.isArray(value) && typeof key === 'number') {
            const index = key < 0 ? value.length + key : key;
            if (index < 0 || index >= value.length)
                throw new RangeError('IndexError: list index out of range');
            value = value[index];
        } else if (isPlainObject(value) && typeof key === 'string') {
            if (!hasKey(value, key)) throw new PyKeyError(key);
            value = value[key];
        } else {
            throw new TypeError(
                `'${typeName(value)}' object is not subscriptable with ${typeof key}`,
            );
        }
    }

    return value as Json;
};

const arr = (value: Json): Json[] => {
    if (!Array.isArray(value)) throw new TypeError(`'${typeName(value)}' object is not a list`);

    return value;
};

const obj = (value: Json): JsonObject => {
    if (!isPlainObject(value)) throw new TypeError(`'${typeName(value)}' object is not a dict`);

    return value;
};

/** dict.get(key) with a None default. */
const dictGet = (container: Json, key: string): Json => {
    const value = obj(container);

    return hasKey(value, key) ? value[key] : null;
};

const str = (value: Json): string => {
    if (typeof value !== 'string')
        throw new TypeError(`expected str instance, ${typeName(value)} found`);

    return value;
};

/** len(): lists, strings (code points) and dicts. */
const len = (value: Json): number => {
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'string') return [...value].length;
    if (isPlainObject(value)) return pyKeys(value).length;
    throw new TypeError(`object of type '${typeName(value)}' has no len()`);
};

/** Python truthiness for JSON-like values. */
const truthy = (value: Json): boolean => {
    if (value === null || value === false || value === 0 || value === '' || value === 0n)
        return false;
    if (value instanceof PyFloat) return value.value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    if (isPlainObject(value)) return pyKeys(value).length > 0;

    return true;
};

/** set(items) for hashable JSON values (strings in practice); lists and dicts are unhashable. */
const pySet = (items: Iterable<Json>): Set<Json> => {
    const result = new Set<Json>();
    for (const item of items) {
        if (item !== null && typeof item === 'object' && !(item instanceof PyFloat)) {
            throw new TypeError(`unhashable type: '${typeName(item)}'`);
        }
        result.add(item);
    }

    return result;
};

const setEquals = (a: Set<Json>, b: Set<Json>): boolean =>
    a.size === b.size && [...a].every(item => b.has(item));

const isSubset = (a: Set<Json>, b: { has: (item: Json) => boolean }): boolean =>
    [...a].every(item => b.has(item));

/** `item in some_list` (== comparison). */
const listIncludes = (items: Json[], item: Json): boolean =>
    items.some(other => pyEquals(other, item));

/** low <= value <= high with Python chained-comparison short-circuiting. */
const between = (low: Json, value: Json, high: () => Json): boolean =>
    pyCompare(low, value) <= 0 && pyCompare(value, high()) <= 0;

/** int(value) for csv cells and XML text. */
const toInt = (value: Json): number | bigint => {
    if (typeof value === 'string') return pyInt(value);
    throw new TypeError(
        `int() argument must be a string, a bytes-like object or a real number, not '${typeName(value)}'`,
    );
};

/** json.loads(value) for csv cells. */
const loads = (value: Json): Json => {
    if (typeof value !== 'string')
        throw new TypeError(
            `the JSON object must be str, bytes or bytearray, not ${typeName(value)}`,
        );

    return pyJsonLoads(value);
};

const joinStrings = (separator: string, items: Json[]): string => items.map(str).join(separator);

/** A value used as a dict key or set member; lists and dicts are unhashable. */
const hashable = (value: Json): Json => {
    pySet([value]);

    return value;
};

/** dict(by key) in insertion order: a later duplicate replaces the value but keeps the first position. */
const indexBy = (items: Json[], key: string): Map<Json, Json> => {
    const result = new Map<Json, Json>();
    for (const item of items) result.set(hashable(at(item, key)), item);

    return result;
};

const mapGet = (map: Map<Json, Json>, key: Json): Json => {
    if (!map.has(key)) throw new PyKeyError(key);

    return map.get(key) as Json;
};

/** list(csv.DictReader(open(path, newline=''))) */
const readCsv = (path: string): JsonObject[] =>
    pyCsvDictReader(readText(path, { newline: '' })) as unknown as JsonObject[];

/**
 * compile() equivalent for the TypeScript scripts: parse and type-strip each file in Node's
 * strip-only mode, which rejects syntax errors and non-erasable TypeScript.
 */
const compileScript = (path: string): void => {
    const source = readText(path);
    const { emitWarning } = process;
    // Silence only the one-time ExperimentalWarning of stripTypeScriptTypes, which compile() has no counterpart for.
    process.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
        const message = typeof warning === 'string' ? warning : warning.message;
        if (message.startsWith('stripTypeScriptTypes')) return;
        (emitWarning as (...args: unknown[]) => void).call(process, warning, ...rest);
    }) as typeof process.emitWarning;
    try {
        stripTypeScriptTypes(source);
    } finally {
        process.emitWarning = emitWarning;
    }
};

/** The published frontend and backend teams must match parts/team-ownership.json, so a config edit needs a rebuild. */
const verifyOwnership = (features: readonly Json[]): void => {
    const config = readJson(pyJoin(HERE, 'parts/team-ownership.json'));
    const teams = new Set(arr(at(config, 'teams')));
    const overrides = at(config, 'feature_teams') as Record<string, Json>;
    const backend = new Map<Json, Json>();
    for (const assignment of arr(at(config, 'backend_team_assignments'))) {
        for (const featureId of arr(at(assignment, 'feature_ids'))) {
            backend.set(featureId, at(assignment, 'team'));
        }
    }
    for (const feature of features) {
        const id = at(feature, 'id') as string;
        const ownership = at(feature, 'ownership');
        const team = at(ownership, 'team');
        pyAssert(teams.has(team) && teams.has(at(ownership, 'backend_team')), ['Unknown team', id]);
        if (hasKey(overrides, id)) {
            pyAssert(pyEquals(team, at(overrides[id], 'team')), ['Stale frontend team', id]);
        }
        pyAssert(pyEquals(at(ownership, 'backend_team'), backend.get(id) ?? team), [
            'Stale backend team',
            id,
        ]);
    }
};

export const verify = (): void => {
    const data = readJson(pyJoin(HERE, 'features.json'));
    const features = arr(at(data, 'features')).map(obj);
    const byId = indexBy(features, 'id');
    pyAssert(byId.size === features.length, 'Duplicate canonical IDs');
    verifyOwnership(features);
    const rawIds: Json[] = [];
    for (const name of ['administration', 'wallet', 'services', 'mobile']) {
        rawIds.push(
            ...arr(at(readJson(pyJoin(HERE, 'parts', name + '.json')), 'features')).map(f =>
                at(f, 'id'),
            ),
        );
    }
    const runtimeManifest = json(readRuntime());
    rawIds.push(...arr(at(runtimeManifest, 'new_features')).map(f => at(f, 'id')));
    rawIds.push(...arr(json(readSourceAdditions())).map(f => at(f, 'id')));
    pyAssert(pySet(rawIds).size === rawIds.length, 'Duplicate source IDs');
    const represented = new Map<Json, number>();
    for (const f of features) {
        for (const source of arr(at(f, 'source_ids'))) {
            represented.set(hashable(source), (represented.get(source) ?? 0) + 1);
        }
    }
    pyAssert(
        setEquals(new Set(represented.keys()), pySet(rawIds)),
        'Lost or invented source identities',
    );
    pyAssert(
        [...represented.values()].every(count => count === 1),
        'A source identity maps more than once',
    );
    const parents = new Map<Json, Json>();
    for (const f of features) parents.set(hashable(at(f, 'id')), at(f, 'parent_id'));
    const parentIds = pySet(
        features.filter(f => truthy(at(f, 'parent_id'))).map(f => at(f, 'parent_id')),
    );
    const baselineResult = json(checkAdditiveBaseline(features));
    const sources = new Set<Json>();
    let roots = 0;
    for (const f of features) {
        pyAssert(at(f, 'parent_id') === null || byId.has(at(f, 'parent_id')), pyStr(at(f, 'id')));
        const path: Json[] = [];
        let current: Json = at(f, 'id');
        while (current !== null) {
            pyAssert(!listIncludes(path, current), 'Cycle at ' + str(current));
            path.push(current);
            current = mapGet(parents, current);
        }
        pyAssert(pyEquals([...path].reverse(), at(f, 'path_ids')), pyStr(at(f, 'id')));
        pyAssert(pyEquals(at(f, 'depth'), path.length - 1));
        pyAssert(
            pyEquals(at(f, 'current_is_leaf'), !parentIds.has(at(f, 'id'))),
            pyStr(at(f, 'id')),
        );
        for (const [platform, status] of pyEntries(obj(at(f, 'platforms')))) {
            pyAssert(['yes', 'conditional', 'no', 'unknown'].includes(status as string));
            if (status === 'no') {
                pyAssert(at(f, 'navigation', platform) === null);
                pyAssert(pyEquals(at(f, 'navigation_alternatives', platform), []));
            }
            if (status === 'yes' || status === 'conditional') {
                pyAssert(truthy(at(f, 'navigation', platform)), [
                    'Missing supported navigation',
                    at(f, 'id'),
                    platform,
                ]);
            }
        }
        pyAssert(truthy(at(f, 'roots')), ['Missing component/containing root', at(f, 'id')]);
        pyAssert(arr(at(f, 'evidence')).some(e => pyEquals(at(e, 'kind'), 'implementation')));
        for (const ref of [...arr(at(f, 'roots')), ...arr(at(f, 'evidence'))]) {
            const refPath = str(at(ref, 'path'));
            const full = pyJoin(REPO, refPath);
            pyAssert(!pyIsAbsolute(refPath) && !pyPathParts(refPath).includes('..'));
            pyAssert(pyIsFile(full), pyStr(refPath));
            pyAssert(
                between(1, at(ref, 'line'), () =>
                    Math.max(1, splitlines(readText(full, { errors: 'replace' })).length),
                ),
            );
            pyAssert(!hasKey(obj(ref), 'symbol_note'), [at(f, 'id'), ref]);
            sources.add(refPath);
        }
        roots += len(at(f, 'roots'));
        for (const related of arr(at(f, 'related_ids'))) {
            pyAssert(byId.has(related) && !pyEquals(related, at(f, 'id')));
        }
        if (truthy(at(f, 'screenshot', 'path'))) {
            pyAssert(pyIsFile(pyJoin(REPO, str(at(f, 'screenshot', 'path')))));
            pyAssert(
                ['existing-historical', 'captured'].includes(
                    at(f, 'screenshot', 'status') as string,
                ),
            );
        }
    }
    const runtime = at(data, 'runtime');
    pyAssert(
        pyEquals(at(runtime, 'observations'), at(runtimeManifest, 'observations')),
        'Generated runtime observations are stale',
    );
    const manifestErrata = hasKey(obj(runtimeManifest), 'errata')
        ? at(runtimeManifest, 'errata')
        : [];
    pyAssert(pyEquals(at(runtime, 'errata'), manifestErrata), 'Generated runtime errata are stale');
    pyAssert(
        pyEquals(
            at(runtime, 'new_feature_ids'),
            arr(at(runtimeManifest, 'new_features')).map(f => at(f, 'id')),
        ),
    );
    const screenshots = indexBy(arr(at(runtime, 'screenshots')), 'id');
    const observations = indexBy(arr(at(runtime, 'observations')), 'id');
    pyAssert(
        screenshots.size === arr(at(runtime, 'screenshots')).length,
        'Duplicate screenshot IDs',
    );
    pyAssert(
        observations.size === arr(at(runtime, 'observations')).length,
        'Duplicate observation IDs',
    );
    pyAssert(
        setEquals(
            new Set(screenshots.keys()),
            pySet(arr(at(runtimeManifest, 'screenshots')).map(s => at(s, 'id'))),
        ),
        'Generated screenshots are stale',
    );
    const errata = arr(at(runtime, 'errata'));
    for (const original of arr(at(runtimeManifest, 'screenshots'))) {
        const capture = mapGet(screenshots, at(original, 'id'));
        pyAssert(
            pyEntries(obj(original)).every(([key, value]) =>
                pyEquals(dictGet(capture, key), value),
            ),
            pyStr(at(capture, 'id')),
        );
        const path = screenshotFile(obj(capture));
        pyAssert(pyEquals(sha256File(path), at(capture, 'sha256')));
        pyAssert(pyEquals(at(capture, 'repository_path'), pyRelativeTo(path, REPO)));
        pyAssert(pyEquals(at(capture, 'explorer_path'), pyRelativeTo(path, HERE)));
        pyAssert(['desktop', 'web', 'mobile'].includes(at(capture, 'platform') as string));
        pyAssert(
            truthy(at(capture, 'feature_ids')) &&
                isSubset(pySet(arr(at(capture, 'feature_ids'))), byId),
        );
        const corrections = errata.filter(e => pyEquals(at(e, 'screenshot_id'), at(capture, 'id')));
        pyAssert(pyEquals(at(capture, 'errata'), corrections));
        pyAssert(
            pyEquals(
                at(capture, 'effective_feature_ids'),
                corrections.length
                    ? at(corrections[corrections.length - 1], 'feature_ids')
                    : at(capture, 'feature_ids'),
            ),
        );
    }
    for (const observation of observations.values()) {
        pyAssert(
            ['observed', 'blocked', 'not-reached'].includes(at(observation, 'status') as string),
        );
        pyAssert(['desktop', 'web', 'mobile'].includes(at(observation, 'platform') as string));
        pyAssert(
            truthy(at(observation, 'feature_ids')) &&
                isSubset(pySet(arr(at(observation, 'feature_ids'))), byId),
        );
        pyAssert(
            arr(at(observation, 'screenshot_ids')).every(screenshotId =>
                screenshots.has(screenshotId),
            ),
        );
        for (const screenshotId of arr(at(observation, 'screenshot_ids'))) {
            const shared = pySet(arr(at(mapGet(screenshots, screenshotId), 'feature_ids')));
            pyAssert([...pySet(arr(at(observation, 'feature_ids')))].some(id => shared.has(id)));
        }
    }
    const superseded = pySet(errata.map(e => at(e, 'observation_id')));
    for (const correction of errata) {
        pyAssert(observations.has(at(correction, 'observation_id')));
        pyAssert(
            listIncludes(
                arr(at(mapGet(observations, at(correction, 'observation_id')), 'screenshot_ids')),
                at(correction, 'screenshot_id'),
            ),
        );
        pyAssert(
            truthy(at(correction, 'feature_ids')) &&
                isSubset(pySet(arr(at(correction, 'feature_ids'))), byId),
        );
        pyAssert(
            truthy(pyStrip(str(at(correction, 'description')))) &&
                truthy(pyStrip(str(at(correction, 'reason')))),
        );
    }
    features.forEach((feature, index) => {
        const id = at(feature, 'id');
        pyAssert(pyEquals(at(feature, 'runtime_order'), index));
        pyAssert(
            pyEquals(
                at(feature, 'runtime_observations'),
                arr(at(runtime, 'observations')).filter(o =>
                    listIncludes(arr(at(o, 'feature_ids')), id),
                ),
            ),
        );
        pyAssert(
            pyEquals(
                at(feature, 'screenshots'),
                arr(at(runtime, 'screenshots')).filter(s =>
                    pySet([
                        ...arr(at(s, 'feature_ids')),
                        ...arr(at(s, 'errata')).flatMap(e => arr(at(e, 'feature_ids'))),
                    ]).has(id),
                ),
            ),
        );
        pyAssert(
            pyEquals(
                at(feature, 'runtime_errata'),
                errata.filter(e =>
                    pySet([
                        ...arr(at(e, 'feature_ids')),
                        ...arr(at(mapGet(observations, at(e, 'observation_id')), 'feature_ids')),
                        ...arr(at(mapGet(screenshots, at(e, 'screenshot_id')), 'feature_ids')),
                    ]).has(id),
                ),
            ),
        );
    });
    const observedIds = pySet(
        [...observations.values()]
            .filter(o => at(o, 'status') === 'observed' && !superseded.has(at(o, 'id')))
            .flatMap(o => arr(at(o, 'feature_ids'))),
    );
    pyAssert(
        pyEquals(
            at(data, 'metadata', 'runtime_audit', 'superseded_observation_ids'),
            pySorted(superseded),
        ),
    );
    pyAssert(
        pyEquals(
            at(data, 'metadata', 'runtime_audit', 'observed_feature_ids'),
            pySorted(observedIds),
        ),
    );
    pyAssert(pyEquals(at(data, 'statistics', 'runtime_observed_features'), observedIds.size));
    pyAssert(pyEquals(at(data, 'statistics', 'runtime_captured_screenshots'), screenshots.size));
    const edges = arr(at(data, 'edges'));
    for (const edge of edges) {
        pyAssert(byId.has(at(edge, 'source')) && byId.has(at(edge, 'target')));
        if (at(edge, 'type') === 'contains') {
            pyAssert(pyEquals(mapGet(parents, at(edge, 'target')), at(edge, 'source')));
        }
    }
    const rows = readCsv(pyJoin(HERE, 'features.csv'));
    pyAssert(
        pyEquals(
            rows.map(row => at(row, 'id')),
            features.map(f => at(f, 'id')),
        ),
    );
    for (let i = 0; i < Math.min(rows.length, features.length); i++) {
        const row = rows[i];
        const feature = features[i];
        pyAssert(
            pyEquals(loads(at(row, 'runtime_observations')), at(feature, 'runtime_observations')),
        );
        pyAssert(pyEquals(loads(at(row, 'screenshots')), at(feature, 'screenshots')));
        pyAssert(pyEquals(loads(at(row, 'runtime_errata')), at(feature, 'runtime_errata')));
        pyAssert(
            pyEquals(toInt(at(row, 'captured_screenshot_count')), len(at(feature, 'screenshots'))),
        );
        pyAssert(pyEquals(loads(at(row, 'test_coverage')), at(feature, 'test_coverage')));
        for (const [axis, value] of pyEntries(obj(at(feature, 'test_coverage')))) {
            pyAssert(pyEquals(toInt(at(row, axis + '_score')), at(value, 'score')));
        }
    }
    const qualityBaseline = json(preserveBaseline(features));
    const axes: readonly string[] = AXES;
    const quality = at(data, 'test_coverage_audit');
    pyAssert(pyEquals(at(quality, 'features_assessed'), features.length));
    pyAssert(pyEquals(at(quality, 'assessment_count'), features.length * 4));
    const rawAssessments = new Map<Json, Json>();
    for (const partition of arr(at(quality, 'partitions'))) {
        const path = pyJoin(HERE, str(at(partition, 'path')));
        pyAssert(pyEquals(sha256File(path), at(partition, 'sha256')));
        for (const record of arr(at(readJson(path), 'assessments'))) {
            const featureId = at(record, 'feature_id');
            pyAssert(!rawAssessments.has(hashable(featureId)));
            rawAssessments.set(featureId, record);
        }
    }
    pyAssert(setEquals(new Set(rawAssessments.keys()), new Set(byId.keys())));
    const sourceSnapshot = obj(
        at(readJson(pyJoin(HERE, 'test-coverage/reviewed-sources.json')), 'files'),
    );
    pyAssert(pyEquals(at(quality, 'reviewed_source_hashes'), sourceSnapshot));
    for (const [path, expectedHash] of pyEntries(sourceSnapshot)) {
        pyAssert(pyEquals(sha256File(pyJoin(REPO, path)), expectedHash));
    }
    for (const feature of features) {
        pyAssert(setEquals(pySet(pyKeys(obj(at(feature, 'test_coverage')))), pySet(axes)));
        for (const axis of axes) {
            const value = at(feature, 'test_coverage', axis);
            const score = at(value, 'score');
            pyAssert(
                (typeof score === 'number' || typeof score === 'bigint') &&
                    between(0, score, () => 10),
            );
            const raw = at(mapGet(rawAssessments, at(feature, 'id')), axis);
            for (const key of pyKeys(obj(raw))) {
                if (key !== 'evidence') pyAssert(pyEquals(at(value, key), at(raw, key)));
            }
            pyAssert(len(at(value, 'evidence')) === len(at(raw, 'evidence')));
            const enrichedEvidence = arr(at(value, 'evidence'));
            const rawEvidence = arr(at(raw, 'evidence'));
            for (let i = 0; i < Math.min(enrichedEvidence.length, rawEvidence.length); i++) {
                const enriched = enrichedEvidence[i];
                const original = rawEvidence[i];
                pyAssert(
                    pyKeys(obj(original)).every(key =>
                        pyEquals(at(enriched, key), at(original, key)),
                    ),
                );
                pyAssert(hasKey(sourceSnapshot, str(at(enriched, 'path'))));
                pyAssert(
                    between(
                        1,
                        at(enriched, 'line'),
                        () => splitlines(readText(pyJoin(REPO, str(at(enriched, 'path'))))).length,
                    ),
                );
            }
        }
    }
    const qualityRows = readCsv(pyJoin(HERE, 'test-coverage.csv'));
    pyAssert(
        pyEquals(
            qualityRows.map(row => at(row, 'id')),
            features.map(feature => at(feature, 'id')),
        ),
    );
    for (let i = 0; i < Math.min(qualityRows.length, features.length); i++) {
        const row = qualityRows[i];
        const feature = features[i];
        for (const axis of axes) {
            const value = at(feature, 'test_coverage', axis);
            pyAssert(pyEquals(toInt(at(row, axis + '_score')), at(value, 'score')));
            pyAssert(pyEquals(at(row, axis + '_rationale'), at(value, 'rationale')));
            pyAssert(pyEquals(loads(at(row, axis + '_evidence')), at(value, 'evidence')));
        }
    }
    const coverage = readCsv(pyJoin(HERE, 'runtime-coverage.csv'));
    pyAssert(
        pyEquals(
            coverage.map(row => at(row, 'id')),
            features.map(f => at(f, 'id')),
        ),
    );
    for (let i = 0; i < Math.min(coverage.length, features.length); i++) {
        const row = coverage[i];
        const feature = features[i];
        const captures = arr(at(feature, 'screenshots')).filter(s =>
            listIncludes(arr(at(s, 'effective_feature_ids')), at(feature, 'id')),
        );
        pyAssert(pyEquals(toInt(at(row, 'current_screenshot_count')), captures.length));
        pyAssert(
            pyEquals(
                at(row, 'screenshot_paths'),
                joinStrings(
                    ' | ',
                    captures.map(s => at(s, 'path')),
                ),
            ),
        );
        for (const platform of ['desktop', 'web', 'mobile']) {
            const active = pySet(
                arr(at(feature, 'runtime_observations'))
                    .filter(
                        o => !superseded.has(at(o, 'id')) && pyEquals(at(o, 'platform'), platform),
                    )
                    .map(o => at(o, 'status')),
            );
            pyAssert(
                pyEquals(
                    at(row, platform + '_runtime'),
                    joinStrings(' | ', pySorted(active)) || 'not-observed',
                ),
            );
        }
    }
    pyAssert(pyEquals(readCsv(pyJoin(HERE, 'edges.csv')), edges));
    const ns = { g: 'http://graphml.graphdrawing.org/xmlns' };
    const graph = xmlParse(pyDecodeUtf8(readBytes(pyJoin(HERE, 'feature-map.graphml'))));
    const attribute = (attrib: Map<string, string>, key: string): string => {
        if (!attrib.has(key)) throw new PyKeyError(key);

        return attrib.get(key) as string;
    };
    pyAssert(
        setEquals(
            new Set(xmlFindAll(graph, './/g:node', ns).map(node => attribute(node.attrib, 'id'))),
            new Set(byId.keys()),
        ),
    );
    pyAssert(
        xmlFindAll(graph, './/g:edge', ns).length ===
            edges.filter(e => at(e, 'type') === 'contains').length,
    );
    for (const node of xmlFindAll(graph, './/g:node', ns)) {
        const values = new Map<string, string | null>();
        for (const item of xmlFindAll(node, 'g:data', ns))
            values.set(attribute(item.attrib, 'key'), item.text);
        for (const axis of axes) {
            const key = axis + '_score';
            if (!values.has(key)) throw new PyKeyError(key);
            pyAssert(
                pyEquals(
                    toInt(values.get(key) as string | null),
                    at(mapGet(byId, attribute(node.attrib, 'id')), 'test_coverage', axis, 'score'),
                ),
            );
        }
    }
    const audit = readJson(pyJoin(HERE, 'source-audit.json'));
    const expected = new Set<Json>(
        ['suite/e2e/tests', 'suite-native-app/app/e2e/tests'].flatMap(root =>
            pyRglob(pyJoin(REPO, root), '*.test.ts').map(p => pyRelativeTo(p, REPO)),
        ),
    );
    const tests = arr(at(audit, 'tests'));
    pyAssert(setEquals(pySet(tests.map(t => at(t, 'path'))), expected));
    pyAssert(tests.length === expected.size);
    for (const source of tests) {
        pyAssert(
            ['mapped', 'reviewed-excluded'].includes(at(source, 'status') as string),
            pyStr(at(source, 'path')),
        );
        pyAssert(truthy(at(source, 'reason')));
        pyAssert(arr(at(source, 'feature_ids')).every(featureId => byId.has(featureId)));
        if (at(source, 'status') === 'mapped') pyAssert(truthy(at(source, 'feature_ids')));
    }
    for (const route of arr(at(audit, 'desktop_routes'))) {
        pyAssert(arr(at(route, 'feature_ids')).every(featureId => byId.has(featureId)));
    }
    for (const example of arr(at(data, 'integration_examples'))) {
        pyAssert(pyIsFile(pyJoin(REPO, str(at(example, 'source')))));
        pyAssert(arr(at(example, 'related_feature_ids')).every(i => byId.has(i)));
    }
    const scripts = pySorted(pyRglob(HERE, '*.ts')).filter(
        script => !pyPathParts(script).includes('node_modules'),
    );
    pyAssert(scripts.length >= 9, ['Unexpectedly few TypeScript scripts', scripts.length]);
    for (const script of scripts) {
        compileScript(script);
    }
    const explorerTemplate = readText(pyJoin(HERE, 'explorer.template.html'));
    const placeholder = '__FEATURE_DATA__';
    const placeholderIdx = explorerTemplate.indexOf(placeholder);
    pyAssert(placeholderIdx >= 0, 'explorer.template.html is missing __FEATURE_DATA__');
    const templateHead = explorerTemplate.slice(0, placeholderIdx).trimEnd();
    const templateTail = explorerTemplate.slice(placeholderIdx + placeholder.length).trimStart();
    const explorerHtml = readText(pyJoin(HERE, 'explorer.html'));
    pyAssert(!explorerHtml.includes(placeholder), 'explorer.html has unreplaced placeholder');
    pyAssert(
        explorerHtml.startsWith(templateHead) && explorerHtml.endsWith(templateTail),
        'explorer.html template drift; rerun node docs/features/feature-map/explorer.ts',
    );
    const embeddedJson = explorerHtml
        .slice(templateHead.length, explorerHtml.length - templateTail.length)
        .trim();
    pyAssert(
        pyEquals(pyJsonLoads(embeddedJson), buildExplorerPayload()),
        'explorer.html payload is stale; rerun node docs/features/feature-map/explorer.ts',
    );
    for (const mdFile of pySorted(pyRglob(HERE, '*.md'))) {
        if (pyPathParts(mdFile).includes('node_modules')) continue;
        const mdDir = nodePath.dirname(mdFile);
        for (const target of pyFindall(pyRe('\\]\\(([^)]+)\\)'), readText(mdFile)) as string[]) {
            if (!pyMatch(pyRe('^[a-z]+:'), target)) {
                const filePart = target.split('#')[0];
                if (filePart) {
                    pyAssert(pyExists(pyJoin(mdDir, filePart)), [
                        pyRelativeTo(mdFile, HERE),
                        target,
                    ]);
                }
            }
        }
    }
    const captureFlows = verifyCaptureFlows();
    process.stdout.write(
        pyJsonDumps(
            {
                result: 'pass',
                canonical_nodes: features.length,
                raw_source_identities: rawIds.length,
                root_references: roots,
                referenced_source_files: sources.size,
                manual_scenarios: tests.filter(t => pyEquals(at(t, 'kind'), 'manual')).length,
                automated_e2e_sources: tests.filter(t => !pyEquals(at(t, 'kind'), 'manual')).length,
                hierarchy_csv_graphml_and_local_links: 'pass',
                additive_baseline: baselineResult,
                runtime_observed_feature_nodes: observedIds.size,
                runtime_screenshots: screenshots.size,
                test_quality_assessments: features.length * 4,
                test_quality_baseline: qualityBaseline,
                application_flows_executed_by_artifact_verifier: false,
                capture_flows: captureFlows.flows,
                capture_flow_landing_checks: captureFlows.landing_checks,
                capture_flow_landing_drift: captureFlows.landing_drift,
            },
            { indent: 2 },
        ) + '\n',
    );
};

if (isMain(import.meta.filename)) verify();
