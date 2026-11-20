import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { readPackageJson } from '@trezor/node-utils';
import { deepEqual } from '@trezor/utils';

import type { Requirement } from '../Requirement';
import {
    CONNECT_PUBLISH_ROOTS,
    type WorkspacePackage,
    collectProdWorkspaceClosure,
    collectWorkspacePackages,
} from '../connectClosure';

// version: the closure is released in lockstep (#30575). repository: npm provenance (#30591).
// bugs, author: every package published with connect points at the same tracker and author.
const UNIFIED_FIELDS = ['version', 'repository', 'bugs', 'author'] as const;

type Drift = {
    readonly pkg: WorkspacePackage;
    readonly field: (typeof UNIFIED_FIELDS)[number];
    readonly expected: unknown;
};

const analyzeClosure = (
    repoRoot: string,
): { readonly errors: ReadonlyArray<string>; readonly drifts: ReadonlyArray<Drift> } => {
    const packages = collectWorkspacePackages(repoRoot);
    // @trezor/connect is the reference and is never rewritten, so the version that
    // bump-version.ts mirrors into connect-common and the README stays in sync.
    const connect = packages.get('@trezor/connect')?.packageJson;

    // The closure walk skips unknown roots, so a renamed root would silently shrink the closure.
    const missingRoots = CONNECT_PUBLISH_ROOTS.filter(root => !packages.has(root));
    if (connect === undefined || missingRoots.length > 0) {
        return {
            errors: [
                `Not workspace packages: ${missingRoots.join(', ')}. Was a Connect root renamed or removed?`,
            ],
            drifts: [],
        };
    }

    const missingFields = UNIFIED_FIELDS.filter(field => connect[field] === undefined);
    if (missingFields.length > 0) {
        return {
            errors: [
                `@trezor/connect has no ${missingFields.map(field => `"${field}"`).join(', ')}.`,
            ],
            drifts: [],
        };
    }

    const drifts = [...collectProdWorkspaceClosure(CONNECT_PUBLISH_ROOTS, packages)]
        .toSorted()
        .flatMap(name => packages.get(name) ?? [])
        .flatMap(pkg =>
            UNIFIED_FIELDS.filter(field => !deepEqual(pkg.packageJson[field], connect[field])).map(
                field => ({ pkg, field, expected: connect[field] }),
            ),
        );

    return { errors: [], drifts };
};

const formatDrift = ({ pkg, field, expected }: Drift) => {
    const actual = pkg.packageJson[field];
    const current =
        actual === undefined ? `has no "${field}"` : `has "${field}" = ${JSON.stringify(actual)}`;

    return `"${pkg.name}" ${current}, but @trezor/connect has ${JSON.stringify(expected)}. Run requirements:fix --only=connect-closure-fields.`;
};

/**
 * Verifies that every package published with @trezor/connect carries the same release-critical
 * package.json fields as @trezor/connect itself.
 */
export const requireConnectClosureUnifiedFields: Requirement<'repo'> = {
    name: 'connect-closure-fields',
    scope: 'repo',
    verify: ({ repoRoot }) => {
        const { errors, drifts } = analyzeClosure(repoRoot);

        return Promise.resolve([...errors, ...drifts.map(formatDrift)]);
    },
    fix: ({ repoRoot }) => {
        const { errors, drifts } = analyzeClosure(repoRoot);

        for (const { pkg, field, expected } of drifts) {
            const packageJson = readPackageJson<Record<string, unknown>>(pkg.dir);
            packageJson[field] = expected;
            writeFileSync(
                join(pkg.dir, 'package.json'),
                `${JSON.stringify(packageJson, null, 4)}\n`,
            );
        }

        return Promise.resolve(errors);
    },
};
