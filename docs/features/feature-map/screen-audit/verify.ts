// Verify the screen audit against the current catalog and source checkout.

import * as nodePath from 'node:path';

import {
    PyKeyError,
    hasKey,
    isMain,
    isPlainObject,
    pyAssert,
    pyDict,
    pyGlob,
    pyIsFile,
    pyJoin,
    pyJsonDumps,
    pyKeys,
    pyPathParts,
    pyRelativeTo,
    pyResolve,
    pyRglob,
    pySorted,
    readJson,
    sha256File,
    writeText,
} from '../pylib.ts';
import type { Json, JsonObject } from '../pylib.ts';
import { checkRouteCoverage } from './routes.ts';

const HERE = pyResolve(import.meta.dirname);
// HERE.parents[3]
const REPO = nodePath.dirname(nodePath.dirname(nodePath.dirname(nodePath.dirname(HERE))));
const CATALOG = nodePath.dirname(HERE);

const pyTypeName = (value: Json): string => {
    if (value === null) return 'NoneType';
    if (Array.isArray(value)) return 'list';
    if (typeof value === 'string') return 'str';
    if (typeof value === 'boolean') return 'bool';
    if (typeof value === 'number' || typeof value === 'bigint') return 'int';

    return 'object';
};

// bool(value) for JSON values.
const pyTruthy = (value: Json): boolean => {
    if (Array.isArray(value)) return value.length > 0;
    if (isPlainObject(value)) return pyKeys(value).length > 0;
    if (value !== null && typeof value === 'object') return value.value !== 0;

    return Boolean(value);
};

// value[key] for a JSON dict or list, raising KeyError/TypeError like Python.
const getItem = (value: Json, key: string): Json => {
    if (isPlainObject(value)) {
        if (!hasKey(value, key)) throw new PyKeyError(key);

        return value[key];
    }
    throw new TypeError(
        `TypeError: ${pyTypeName(value)} indices must be integers or slices, not str`,
    );
};

// Iteration over a JSON value as Python's `for x in value` does.
const pyIter = (value: Json): Json[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [...value];
    if (isPlainObject(value)) return pyKeys(value);
    throw new TypeError(`TypeError: '${pyTypeName(value)}' object is not iterable`);
};

// len(value)
const pyLen = (value: Json): number => {
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'string') return [...value].length;
    if (isPlainObject(value)) return pyKeys(value).length;
    throw new TypeError(`TypeError: object of type '${pyTypeName(value)}' has no len()`);
};

// Path arithmetic requires str operands.
const asPath = (value: Json): string => {
    if (typeof value !== 'string') {
        throw new TypeError(
            `TypeError: argument should be a str or an os.PathLike object, not '${pyTypeName(value)}'`,
        );
    }

    return value;
};

// Python set/dict membership of JSON scalars; all keys in the audit data are strings.
const setKey = (value: Json): string => {
    if (typeof value !== 'string')
        throw new TypeError(`TypeError: unhashable or non-string key: ${String(value)}`);

    return value;
};

const verify = (): void => {
    const features = pyIter(getItem(readJson(nodePath.join(CATALOG, 'features.json')), 'features'));
    const byId = new Map<string, Json>();
    for (const feature of features) byId.set(setKey(getItem(feature, 'id')), feature);
    const reviewed = new Set<string>();
    const sources = new Set<string>();
    const additions = new Set<string>();
    const counts: JsonObject = {};
    for (const name of ['desktop-wallet', 'desktop-administration-services', 'mobile']) {
        const audit = readJson(nodePath.join(HERE, name + '.json'));
        const reviews = getItem(audit, 'screen_reviews');
        counts[name] = pyLen(reviews);
        for (const review of pyIter(reviews)) {
            const path = getItem(review, 'path');
            pyAssert(pyIsFile(pyJoin(REPO, asPath(path))), ['Missing screen', path]);
            const disposition = getItem(review, 'disposition');
            pyAssert(pyTruthy(disposition), ['Missing disposition', path]);
            pyAssert(
                pyIter(getItem(review, 'feature_ids')).every(id => byId.has(setKey(id))),
                ['Unknown feature', path],
            );
            for (const component of pyIter(getItem(review, 'inspected_components'))) {
                pyAssert(pyIsFile(pyJoin(REPO, asPath(component))), [
                    'Missing component',
                    component,
                ]);
                sources.add(setKey(component));
            }
            reviewed.add(setKey(path));
            sources.add(setKey(path));
        }
        for (const feature of pyIter(getItem(audit, 'new_features'))) {
            const featureId = getItem(feature, 'id');
            pyAssert(byId.has(setKey(featureId)), ['Addition was not integrated', featureId]);
            pyAssert(!additions.has(setKey(featureId)), ['Duplicate addition', featureId]);
            additions.add(setKey(featureId));
            pyAssert(pyLen(getItem(byId.get(setKey(featureId)) ?? null, 'test_coverage')) === 4);
        }
        for (const path of pyIter(getItem(audit, 'files_reviewed'))) {
            pyAssert(pyIsFile(pyJoin(REPO, asPath(path))), ['Missing reviewed source', path]);
            sources.add(setKey(path));
        }
    }

    // Route completeness report must match a fresh generation from the current source.
    const routeCoverageProblems = checkRouteCoverage();
    pyAssert(routeCoverageProblems.length === 0, routeCoverageProblems.join('\n'));

    // Missing ledger entries are reported, never relabeled as inspected screens.
    const desktop = new Set(
        pyGlob(pyJoin(REPO, 'suite-app/app/src/pages'), '*.tsx').map(p => pyRelativeTo(p, REPO)),
    );
    const mobile = new Set<string>();
    for (const root of ['suite-native', 'suite-native-app']) {
        for (const p of pyRglob(pyJoin(REPO, root), '*Screen.tsx')) {
            const parts = pyPathParts(p);
            if (!parts.includes('__tests__') && !parts.includes('node_modules'))
                mobile.add(pyRelativeTo(p, REPO));
        }
    }
    const report = pyDict([
        ['checks', 'pass'],
        ['review_entries', counts],
        ['unique_reviewed_entries', reviewed.size],
        ['integrated_additions', additions.size],
        ['desktop_page_files', desktop.size],
        ['mobile_screen_files', mobile.size],
        [
            'desktop_pages_without_ledger_entry',
            pySorted([...desktop].filter(p => !reviewed.has(p))),
        ],
        [
            'mobile_screens_without_ledger_entry',
            pySorted([...mobile].filter(p => !reviewed.has(p))),
        ],
        [
            'source_sha256',
            pyDict(pySorted(sources).map(path => [path, sha256File(pyJoin(REPO, path))])),
        ],
        [
            'interpretation',
            'Source inspection, not runtime or test execution. File enumeration is a completeness cross-check; helpers, internal screens and aliases require explicit dispositions.',
        ],
    ]);
    writeText(nodePath.join(HERE, 'verification.json'), pyJsonDumps(report, { indent: 4 }) + '\n');
    const printed = pyDict(
        pyKeys(report)
            .filter(key => key !== 'source_sha256')
            .map(key => [key, report[key]]),
    );
    process.stdout.write(pyJsonDumps(printed, { indent: 2 }) + '\n');
};

if (isMain(import.meta.filename)) verify();
