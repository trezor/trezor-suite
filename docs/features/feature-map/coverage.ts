// Validate and attach source-reviewed test-quality assessments without changing feature data.
import {
    FEATURE_MAP_DIR,
    PyKeyError,
    REPO_ROOT,
    hasKey,
    isPlainObject,
    pyAssert,
    pyDecodeUtf8,
    pyDeepCopy,
    pyDict,
    pyDigest,
    pyEntries,
    pyEquals,
    pyExists,
    pyIsAbsolute,
    pyIsFile,
    pyJoin,
    pyKeys,
    pyPathParts,
    pyPathStr,
    pyPathValue,
    pySetKey,
    pySorted,
    pyStr,
    pyStrip,
    readBytes,
    readJson,
    sha256File,
    sha256Hex,
    splitlines,
} from './pylib.ts';
import type { Json, JsonObject } from './pylib.ts';

const HERE = FEATURE_MAP_DIR;
const REPO = REPO_ROOT;
export const AXES = [
    'desktop_automated',
    'android_automated',
    'desktop_manual',
    'android_manual',
] as const;
export const PARTITIONS = ['administration', 'wallet', 'services'] as const;

const typeName = (value: unknown): string => {
    if (value === null) return 'NoneType';
    if (Array.isArray(value)) return 'list';
    if (typeof value === 'string') return 'str';
    if (typeof value === 'boolean') return 'bool';
    if (typeof value === 'number' || typeof value === 'bigint') return 'int';

    return isPlainObject(value) ? 'dict' : 'float';
};

/** container[key] on a JSON value: KeyError for a missing dict key, TypeError otherwise. */
const getItem = (container: Json | undefined, key: string): Json => {
    if (isPlainObject(container) && !Array.isArray(container)) {
        if (!hasKey(container, key)) throw new PyKeyError(key);

        return container[key];
    }
    throw new TypeError(`'${typeName(container)}' object is not subscriptable by str`);
};

const asObject = (value: Json): JsonObject => {
    if (!isPlainObject(value) || Array.isArray(value))
        throw new TypeError(`expected dict, got '${typeName(value)}'`);

    return value;
};

const asString = (value: Json): string => {
    if (typeof value !== 'string') throw new TypeError(`expected str, got '${typeName(value)}'`);

    return value;
};

/** iter(value) for JSON values: list items, str characters, dict keys. */
const pyIter = (value: Json): Json[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [...value];
    if (isPlainObject(value)) return pyKeys(value);
    throw new TypeError(`'${typeName(value)}' object is not iterable`);
};

/** len(value) for JSON values. */
const pyLen = (value: Json): number => {
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'string') return [...value].length;
    if (isPlainObject(value)) return pyKeys(value).length;
    throw new TypeError(`object of type '${typeName(value)}' has no len()`);
};

/** `needle in haystack` for JSON values. */
const pyIn = (needle: Json, haystack: Json): boolean => {
    if (Array.isArray(haystack)) return haystack.some(item => pyEquals(item, needle));
    if (typeof haystack === 'string') return haystack.includes(asString(needle));
    if (isPlainObject(haystack)) return typeof needle === 'string' && hasKey(haystack, needle);
    throw new TypeError(`argument of type '${typeName(haystack)}' is not iterable`);
};

/** Python truthiness for JSON values. */
const truthy = (value: Json): boolean => {
    if (value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && isPlainObject(value)) return pyKeys(value).length > 0;
    if (typeof value === 'object') return value.value !== 0;

    return Boolean(value);
};

const setEquals = (a: ReadonlySet<Json>, b: ReadonlySet<Json>): boolean =>
    a.size === b.size && [...a].every(item => b.has(item));

/** `type(value) is int` */
const isInt = (value: Json): value is number | bigint =>
    typeof value === 'number' || typeof value === 'bigint';

export const digest = (value: unknown): string => pyDigest(value);

/** Links derived from the source location (local_link) or the published Git base (github_url). */
export const DERIVED_LINK_KEYS: ReadonlySet<string> = new Set(['local_link', 'github_url']);

/** A copy without derived links at any depth, so baseline hashes do not depend on the checkout. */
export const withoutDerivedLinks = (value: Json): Json => {
    if (Array.isArray(value)) return value.map(withoutDerivedLinks);
    if (isPlainObject(value)) {
        return pyDict(
            pyEntries(value)
                .filter(([key]) => !DERIVED_LINK_KEYS.has(key))
                .map(([key, item]) => [key, withoutDerivedLinks(item)] as const),
        );
    }

    return value;
};

export const preserveBaseline = (features: readonly JsonObject[]): JsonObject => {
    const baseline = asObject(readJson(pyJoin(HERE, 'test-coverage/baseline.json')));
    const byId = new Map<Json, JsonObject>();
    for (const feature of features) byId.set(getItem(feature, 'id'), feature);
    // Captures from the runtime supplement are additions; the pinned manifest is checked below.
    const supplementPath = pyJoin(HERE, 'parts/runtime-supplement.json');
    const supplement = pyExists(supplementPath) ? asObject(readJson(supplementPath)) : {};
    const supplementIds = new Set<Json>(
        ['observations', 'screenshots'].flatMap(key =>
            hasKey(supplement, key)
                ? pyIter(getItem(supplement, key)).map(x => getItem(x, 'id'))
                : [],
        ),
    );
    const withoutSupplement = (list: Json): Json[] =>
        pyIter(list).filter(item => !supplementIds.has(getItem(item, 'id')));
    for (const [featureId, expected] of pyEntries(asObject(getItem(baseline, 'feature_hashes')))) {
        pyAssert(byId.has(featureId), ['Existing feature removed', featureId]);
        // runtime_order and current_is_leaf are derived from the tree; ownership is curated in parts/team-ownership.json.
        const excluded = [
            'test_coverage',
            'runtime_order',
            'current_is_leaf',
            'ownership',
            'ownership_by_platform',
        ];
        const original = pyDict(
            pyEntries(byId.get(featureId) as JsonObject).filter(([key]) => !excluded.includes(key)),
        );
        for (const key of ['runtime_observations', 'screenshots']) {
            if (hasKey(original, key)) original[key] = withoutSupplement(original[key]);
        }
        if (hasKey(original, 'variants')) {
            original.variants = pyIter(original.variants).map(v =>
                pyDict(pyEntries(asObject(v)).filter(([key]) => key !== 'ownership')),
            );
        }
        pyAssert(pyEquals(digest(withoutDerivedLinks(original)), expected), [
            'Pre-assessment feature data changed',
            featureId,
        ]);
    }
    const manifest = asObject(readJson(pyJoin(HERE, 'parts/runtime-observations.json')));
    const captures = new Map<Json, Json>();
    for (const s of pyIter(getItem(manifest, 'screenshots'))) captures.set(getItem(s, 'id'), s);
    for (const [screenshotId, expected] of pyEntries(
        asObject(getItem(baseline, 'screenshot_sha256')),
    )) {
        if (!captures.has(screenshotId)) throw new PyKeyError(screenshotId);
        const capture = captures.get(screenshotId) as Json;
        pyAssert(pyEquals(sha256File(pyJoin(REPO, asString(getItem(capture, 'path')))), expected));
    }
    pyAssert(
        pyEquals(
            sha256File(pyJoin(HERE, 'parts/runtime-observations.json')),
            getItem(baseline, 'runtime_manifest_sha256'),
        ),
    );

    return {
        status: 'pass',
        feature_records: pyLen(getItem(baseline, 'feature_hashes')),
        screenshots: pyLen(getItem(baseline, 'screenshot_sha256')),
    };
};

const missingAssessment = (featureId: Json): never => {
    throw new PyKeyError(featureId);
};

export const attachAssessments = (
    features: readonly JsonObject[],
    publishedBase: string,
    changed: ReadonlySet<string>,
    tracked: ReadonlySet<string>,
): JsonObject => {
    const contract = asObject(readJson(pyJoin(HERE, 'test-coverage/contract.json')));
    const expectedIds = new Set<Json>(features.map(feature => getItem(feature, 'id')));
    const assessments = new Map<Json, JsonObject>();
    let reviewedFiles = new Set<string>();
    const parts: JsonObject[] = [];
    const sourceHashes: JsonObject = {};
    const sourceLines = new Map<string, number>();

    const inspectSource = (path: string): number => {
        pyAssert(!pyIsAbsolute(path) && !pyPathParts(path).includes('..'));
        if (!hasKey(sourceHashes, path)) {
            const full = pyJoin(REPO, path);
            pyAssert(pyIsFile(full), ['Missing test source', path]);
            const raw = readBytes(full);
            pySetKey(sourceHashes, path, sha256Hex(raw));
            sourceLines.set(path, splitlines(pyDecodeUtf8(raw)).length);
        }

        return sourceLines.get(path) as number;
    };

    for (const partition of PARTITIONS) {
        const relative = 'test-coverage/assessment-' + partition + '.json';
        const path = pyJoin(HERE, relative);
        pyAssert(pyIsFile(path), [
            'Test-quality review is incomplete; do not default missing scores to zero',
            relative,
        ]);
        const part = asObject(readJson(path));
        const scope = readJson(pyJoin(HERE, 'test-coverage/scope-' + partition + '.json'));
        const records = getItem(part, 'assessments');
        const ids = pyIter(records).map(record => getItem(record, 'feature_id'));
        pyAssert(ids.length === new Set(ids).size, ['Duplicate reviewed feature', partition]);
        pyAssert(setEquals(new Set(ids), new Set(pyIter(getItem(scope, 'feature_ids')))), [
            'Assessment partition does not match scope',
            partition,
        ]);
        pyAssert(setEquals(new Set(pyIter(getItem(part, 'feature_ids'))), new Set(ids)));
        for (const file of pyIter(getItem(part, 'files_reviewed')))
            reviewedFiles.add(asString(file));
        parts.push({
            path: relative,
            features: ids.length,
            sha256: sha256File(path),
            limitations: hasKey(part, 'limitations') ? part.limitations : [],
        });
        for (const record of pyIter(records)) {
            const featureId = getItem(record, 'feature_id');
            pyAssert(!assessments.has(featureId) && expectedIds.has(featureId));
            pyAssert(setEquals(new Set(pyIter(record)), new Set<Json>(['feature_id', ...AXES])), [
                'Unexpected assessment fields',
                featureId,
            ]);
            const result: JsonObject = {};
            for (const axis of AXES) {
                const value = pyDeepCopy(getItem(record, axis));
                const score = getItem(value, 'score');
                pyAssert(isInt(score) && 0 <= score && score <= 10, [
                    'Invalid score',
                    featureId,
                    axis,
                ]);
                for (const field of ['confidence', 'applicability', 'basis']) {
                    pyAssert(
                        pyIn(getItem(value, field), getItem(getItem(contract, 'enums'), field)),
                        [featureId, axis, field],
                    );
                }
                const rationale = getItem(value, 'rationale');
                pyAssert(typeof rationale === 'string' && pyStrip(rationale));
                for (const field of ['covered_intents', 'gaps']) {
                    const list = getItem(value, field);
                    pyAssert(
                        Array.isArray(list) && list.every(s => typeof s === 'string' && pyStrip(s)),
                    );
                }
                pyAssert(Array.isArray(getItem(value, 'evidence')));
                const evidenceList = getItem(value, 'evidence') as Json[];
                if (truthy(score)) {
                    pyAssert(truthy(getItem(value, 'covered_intents')) && truthy(evidenceList), [
                        'Positive score needs verified intents and evidence',
                        featureId,
                        axis,
                    ]);
                    const requiredExecution = axis.endsWith('manual')
                        ? 'manual-procedure'
                        : 'active';
                    pyAssert(
                        evidenceList.some(e =>
                            pyEquals(getItem(e, 'execution'), requiredExecution),
                        ),
                        ['No applicable active test/procedure', featureId, axis],
                    );
                } else {
                    pyAssert(!truthy(getItem(value, 'covered_intents')), [
                        'Zero score cannot claim verified intents',
                        featureId,
                        axis,
                    ]);
                }
                if (score < 10) {
                    pyAssert(truthy(getItem(value, 'gaps')), [
                        'Non-ideal score needs a meaningful gap',
                        featureId,
                        axis,
                    ]);
                }
                for (const evidenceItem of evidenceList) {
                    const evidence = asObject(evidenceItem);
                    const sourceRaw = asString(getItem(evidence, 'path'));
                    const source = pyPathStr(sourceRaw);
                    pyAssert(!pyIsAbsolute(sourceRaw) && !pyPathParts(sourceRaw).includes('..'));
                    pyAssert(
                        !source.startsWith('docs/features/feature-map/'),
                        'The catalog is a discovery aid, not test verification evidence',
                    );
                    const full = pyJoin(REPO, source);
                    pyAssert(pyIsFile(full), [
                        'Missing test evidence',
                        featureId,
                        pyPathValue(source),
                    ]);
                    const line = getItem(evidence, 'line');
                    pyAssert(isInt(line) && 1 <= line && line <= inspectSource(source), [
                        'Bad source line',
                        pyPathValue(source),
                        line,
                    ]);
                    for (const field of ['scenario', 'verification']) {
                        const text = getItem(evidence, field);
                        pyAssert(typeof text === 'string' && pyStrip(text));
                    }
                    pyAssert(
                        pyIn(
                            getItem(evidence, 'execution'),
                            getItem(getItem(contract, 'enums'), 'execution'),
                        ),
                    );
                    const lineStr = pyStr(line);
                    pySetKey(evidence, 'local_link', source + ':' + lineStr);
                    pySetKey(evidence, 'repository_link', '../../../' + source + '#L' + lineStr);
                    pySetKey(
                        evidence,
                        'github_url',
                        tracked.has(source) && !changed.has(source)
                            ? 'https://github.com/trezor/trezor-suite/blob/' +
                                  publishedBase +
                                  '/' +
                                  source +
                                  '#L' +
                                  lineStr
                            : null,
                    );
                    reviewedFiles.add(source);
                }
                pySetKey(result, axis, value);
            }
            assessments.set(featureId, result);
        }
    }
    const assessed = new Set<Json>(assessments.keys());
    pyAssert(setEquals(assessed, expectedIds), [
        'Every feature needs all four assessments',
        new Set([...expectedIds].filter(id => !assessed.has(id))),
    ]);
    reviewedFiles = new Set(
        [...reviewedFiles].filter(path => !path.startsWith('docs/features/feature-map/')),
    );
    for (const path of pySorted(reviewedFiles)) inspectSource(path);
    const sourceBaseline = readJson(pyJoin(HERE, 'test-coverage/reviewed-sources.json'));
    pyAssert(
        pyEquals(getItem(sourceBaseline, 'files'), sourceHashes),
        'Reviewed tests/helpers/config changed or review scope drifted; re-review before rebuilding scores',
    );
    for (const feature of features) {
        pySetKey(
            feature,
            'test_coverage',
            assessments.get(getItem(feature, 'id')) ?? missingAssessment(getItem(feature, 'id')),
        );
    }
    const baseline = preserveBaseline(features);
    const stats = pyDict(
        AXES.map(axis => {
            const distribution = pyDict(
                Array.from({ length: 11 }, (_, score): [string, Json] => [
                    String(score),
                    features.filter(feature =>
                        pyEquals(
                            getItem(getItem(getItem(feature, 'test_coverage'), axis), 'score'),
                            score,
                        ),
                    ).length,
                ]),
            );

            return [
                axis,
                {
                    distribution,
                    interpretation:
                        'Mixed-granularity inventory summary, not a test pass rate or weighted product quality metric.',
                },
            ];
        }),
    );

    return {
        axes: [...AXES],
        features_assessed: features.length,
        assessment_count: features.length * 4,
        methodology: 'test-coverage/README.md',
        rubric: contract,
        partitions: parts,
        reviewed_source_hashes: sourceHashes,
        baseline_preservation: baseline,
        statistics: stats,
        execution_claim: 'Source-quality assessment only; application test suites were not run.',
    };
};
