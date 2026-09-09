import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { readPackageJson } from '@trezor/node-utils';
import { arrayToDictionary, deepEqual, typedObjectEntries } from '@trezor/utils';

import { pickCanonicalVersion } from '../../versions';
import type { Requirement } from '../Requirement';
import {
    type WorkspacePackage,
    collectProdWorkspaceClosure,
    collectWorkspacePackages,
} from '../connectClosure';

/**
 * Canonical, order-insensitive serialization: object keys are sorted recursively
 * so structurally-equal values (e.g. `{ type, url }` and `{ url, type }`) map to
 * the same key.
 */
const canonicalKey = (value: unknown): string => {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value) ?? 'undefined';
    }

    if (Array.isArray(value)) {
        return `[${value.map(canonicalKey).join(',')}]`;
    }

    const entries = Object.keys(value)
        .sort()
        .map(
            key =>
                `${JSON.stringify(key)}:${canonicalKey((value as Record<string, unknown>)[key])}`,
        );

    return `{${entries.join(',')}}`;
};

/**
 * Pick the most common value among the given values, compared structurally
 * (order-insensitively). Ties are broken deterministically by the canonical key,
 * so the result is stable regardless of input order. Returns `undefined` for
 * empty input.
 *
 * Lives here rather than in the shared `versions.ts` because this requirement is
 * its only consumer.
 */
const mostCommon = (values: ReadonlyArray<unknown>): unknown => {
    const counts = new Map<string, { readonly value: unknown; count: number }>();

    for (const value of values) {
        const key = canonicalKey(value);
        const entry = counts.get(key);

        if (entry) {
            entry.count += 1;
        } else {
            counts.set(key, { value, count: 1 });
        }
    }

    const sorted = [...counts.entries()].sort((a, b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count; // higher frequency first

        return a[0].localeCompare(b[0]); // deterministic tie-break
    });

    return sorted[0]?.[1].value;
};

/**
 * Entry packages of the Trezor Connect family. Every internal workspace package
 * reachable from these through production dependencies (`dependencies` and
 * `optionalDependencies`) is published together as part of a Connect release.
 *
 * `@trezor/connect` (the core) is included on purpose: the public entry points
 * (`connect-web`/`connect-mobile`/`connect-webextension`) are thin and do not
 * reach deeper packages such as `@trezor/transport-*`, which nevertheless ship
 * with every Connect release.
 */
const CONNECT_CLOSURE_ROOTS = [
    '@trezor/connect',
    '@trezor/connect-web',
    '@trezor/connect-mobile',
    '@trezor/connect-webextension',
] as const;

type UnifiedField = {
    readonly name: string;
    /** Chooses the value the whole closure should agree on. */
    readonly pickCanonical: (values: ReadonlyArray<unknown>) => unknown;
};

/**
 * package.json fields that every published package in the Connect closure must
 * share. Each field either shares one value across the closure or is missing on
 * the packages that lag behind; both are treated as drift and aligned on fix.
 *
 * This list is intentionally conservative: it only carries fields that are
 * release-critical and already unified across the closure today. Metadata fields
 * such as `bugs` and `author` are good future additions once the packages that
 * currently lack them are filled in. Fields that legitimately vary per package
 * (`license`, `homepage`, `publishConfig`, `type`, `sideEffects`) are excluded.
 */
const UNIFIED_FIELDS: ReadonlyArray<UnifiedField> = [
    // Release lockstep — see #30575.
    { name: 'version', pickCanonical: values => pickCanonicalVersion(values.map(String)) },
    // NPM provenance requires a repository field on every published package — see #30591.
    { name: 'repository', pickCanonical: mostCommon },
];

type FieldDrift = {
    readonly field: string;
    readonly packageName: string;
    readonly dir: string;
    readonly actual: unknown;
    readonly canonical: unknown;
};

const analyzeClosure = (
    repoRoot: string,
): { readonly drifts: ReadonlyArray<FieldDrift> } | { readonly error: string } => {
    const packages = collectWorkspacePackages(repoRoot);
    const closureNames = [...collectProdWorkspaceClosure(CONNECT_CLOSURE_ROOTS, packages)].sort();

    if (closureNames.length === 0) {
        return {
            error: `No Connect closure packages found. Expected at least one of: ${CONNECT_CLOSURE_ROOTS.join(', ')}.`,
        };
    }

    const publicPackages = closureNames
        .map(name => packages.get(name))
        .filter(
            (pkg): pkg is WorkspacePackage => pkg !== undefined && pkg.packageJson.private !== true,
        );

    if (publicPackages.length === 0) {
        return { error: 'No published Connect closure packages found.' };
    }

    const drifts: FieldDrift[] = [];

    for (const field of UNIFIED_FIELDS) {
        const presentValues = publicPackages
            .map(pkg => pkg.packageJson[field.name])
            .filter(value => value !== undefined);

        if (presentValues.length === 0) continue;

        const canonical = field.pickCanonical(presentValues);

        for (const pkg of publicPackages) {
            const actual = pkg.packageJson[field.name];

            if (deepEqual(actual, canonical)) continue;

            drifts.push({
                field: field.name,
                packageName: pkg.name,
                dir: pkg.dir,
                actual,
                canonical,
            });
        }
    }

    return { drifts };
};

const formatDriftError = ({ field, packageName, actual, canonical }: FieldDrift): string => {
    const current =
        actual === undefined
            ? `has no "${field}" field`
            : `has "${field}" = ${JSON.stringify(actual)}`;

    return `"${packageName}" ${current} but the Connect closure uses ${JSON.stringify(canonical)}. Run requirements:fix --only=connect-closure-fields.`;
};

/**
 * Verifies that every published package in the `@trezor/connect` production
 * closure shares the same value for a set of release-critical package.json fields
 * (see UNIFIED_FIELDS), so the whole family is published in lockstep and no
 * package is released with stale or missing metadata.
 */
export const requireConnectClosureUnifiedFields: Requirement<'repo'> = {
    name: 'connect-closure-fields',
    scope: 'repo',
    verify: ({ repoRoot }) => {
        const analysis = analyzeClosure(repoRoot);

        if ('error' in analysis) {
            return Promise.resolve([analysis.error]);
        }

        return Promise.resolve(analysis.drifts.map(formatDriftError));
    },
    fix: ({ repoRoot }) => {
        const analysis = analyzeClosure(repoRoot);

        if ('error' in analysis) {
            return Promise.resolve([analysis.error]);
        }

        const driftsByDir = arrayToDictionary([...analysis.drifts], drift => drift.dir, true);

        for (const [dir, drifts] of typedObjectEntries(driftsByDir)) {
            const pkgPath = join(dir, 'package.json');
            const parsed = readPackageJson<Record<string, unknown>>(dir);

            for (const drift of drifts) {
                parsed[drift.field] = drift.canonical;
            }

            writeFileSync(pkgPath, JSON.stringify(parsed, null, 4) + '\n', 'utf-8');
        }

        return Promise.resolve([]);
    },
};
