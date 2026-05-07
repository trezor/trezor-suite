import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as semver from 'semver';

import { listAllWorkspaces, readPackageJson } from '../../workspaces';
import type { Requirement } from '../Requirement';

/**
 * Dependencies where version differences are intentional (e.g. ongoing major-version
 * migrations, peer-dependency constraints from third-party libraries, etc.).
 *
 * Each entry should include a brief reason.
 * Entries SHOULD be removed once the migration or constraint is resolved.
 */
export const ALLOWED_DRIFTS = new Set([
    '@scure/base', // ESM-only v2 is used only where CJS compatibility is not required yet.
    'babel-jest', // waiting for suite-native who are waiting for expo to update babel-jest
]);

type PackageJson = {
    readonly name?: string;
    readonly workspaces?: { readonly packages?: ReadonlyArray<string> } | ReadonlyArray<string>;
    readonly resolutions?: Record<string, string>;
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
};

type VersionOccurrence = {
    readonly version: string;
    readonly workspace: string;
    readonly depType: 'dependencies' | 'devDependencies' | 'resolutions';
};

const listWorkspaceDirs = (repoRoot: string): ReadonlyArray<string> =>
    listAllWorkspaces(repoRoot).map(workspace => workspace.dir);

const collectDependencyVersions = (workspaceDirs: ReadonlyArray<string>) => {
    const depMap = new Map<string, VersionOccurrence[]>();

    for (const dir of workspaceDirs) {
        const pkg = readPackageJson<PackageJson>(dir);
        const workspaceName = pkg.name ?? dir;

        for (const depType of ['dependencies', 'devDependencies', 'resolutions'] as const) {
            const deps = pkg[depType];

            if (deps === undefined) continue;

            for (const [name, version] of Object.entries(deps)) {
                // Skip workspace protocol references (internal packages)
                if (version.startsWith('workspace:')) continue;

                // Skip git/github/file/link/patch references
                if (
                    version.startsWith('git') ||
                    version.startsWith('file:') ||
                    version.startsWith('link:') ||
                    version.startsWith('portal:') ||
                    version.startsWith('patch:') ||
                    version.includes('#')
                ) {
                    continue;
                }

                const occurrences = depMap.get(name) ?? [];
                occurrences.push({ version, workspace: workspaceName, depType });
                depMap.set(name, occurrences);
            }
        }
    }

    return depMap;
};

const findVersionDrifts = (
    depMap: Map<string, VersionOccurrence[]>,
): Map<string, VersionOccurrence[]> => {
    const drifts = new Map<string, VersionOccurrence[]>();

    for (const [name, occurrences] of depMap) {
        if (ALLOWED_DRIFTS.has(name)) continue;

        const uniqueVersions = new Set(occurrences.map(o => o.version));

        if (uniqueVersions.size > 1) {
            drifts.set(name, occurrences);
        }
    }

    return drifts;
};

/**
 * Find ALLOWED_DRIFTS entries that are stale because the dependency versions
 * are already unified across all workspaces (no actual drift exists).
 * This prevents the allowlist from growing endlessly after migrations complete.
 */
const findStaleAllowedDrifts = (depMap: Map<string, VersionOccurrence[]>): string[] => {
    const errors: string[] = [];

    for (const name of ALLOWED_DRIFTS) {
        const occurrences = depMap.get(name);

        if (occurrences === undefined) continue;

        const uniqueVersions = new Set(occurrences.map(o => o.version));

        if (uniqueVersions.size === 1) {
            errors.push(
                `"${name}" is in ALLOWED_DRIFTS but all versions are already unified. Remove it from ALLOWED_DRIFTS.`,
            );
        }
    }

    return errors;
};

const formatDriftError = (depName: string, occurrences: VersionOccurrence[]): string => {
    const versionDetails = occurrences
        .map(o => `${o.version} in ${o.workspace} (${o.depType})`)
        .join(', ');

    return `"${depName}" has mismatched versions: ${versionDetails}`;
};

/**
 * Strip common version range prefixes (^, ~, >=, <=, >, <, =) so that the
 * bare version string can be compared numerically.
 */
const stripRangePrefix = (specifier: string): string => specifier.replace(/^[~^]|^[><=]+\s*/g, '');

/**
 * Pick the canonical version for a drifted dependency.
 * Strategy: most frequent version wins; ties broken by the numerically higher
 * version specifier (e.g. "^10.2.0" wins over "^9.5.0").
 */
const pickCanonicalVersion = (occurrences: VersionOccurrence[]): string => {
    const frequencyMap = new Map<string, number>();

    for (const o of occurrences) {
        frequencyMap.set(o.version, (frequencyMap.get(o.version) ?? 0) + 1);
    }

    const sorted = [...frequencyMap.entries()].sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]; // higher frequency first

        // later versions first
        return semver.rcompare(stripRangePrefix(a[0]), stripRangePrefix(b[0]), { loose: true });
    });

    return sorted[0][0];
};

/**
 * Verifies that every external (non-workspace) dependency uses the same version specifier
 * across all workspaces in the monorepo.
 */
export const requireUnifiedDependencyVersions: Requirement<'repo'> = {
    name: 'unified-dependency-versions',
    scope: 'repo',
    verify: ({ repoRoot }) => {
        const workspaceDirs = listWorkspaceDirs(repoRoot);
        const depMap = collectDependencyVersions(workspaceDirs);
        const drifts = findVersionDrifts(depMap);
        const staleErrors = findStaleAllowedDrifts(depMap);

        const errors: string[] = [...staleErrors];

        for (const [depName, occurrences] of drifts) {
            errors.push(formatDriftError(depName, occurrences));
        }

        return Promise.resolve(errors);
    },
    fix: ({ repoRoot }) => {
        const workspaceDirs = listWorkspaceDirs(repoRoot);
        const depMap = collectDependencyVersions(workspaceDirs);
        const drifts = findVersionDrifts(depMap);
        const staleErrors = findStaleAllowedDrifts(depMap);

        if (drifts.size === 0 && staleErrors.length === 0) {
            return Promise.resolve([]);
        }

        if (drifts.size === 0) {
            return Promise.resolve([...staleErrors]);
        }

        // Determine the canonical version for each drifted dependency
        const canonicalVersions = new Map<string, string>();

        for (const [depName, occurrences] of drifts) {
            canonicalVersions.set(depName, pickCanonicalVersion(occurrences));
        }

        // Apply fixes to workspace package.json files
        // Stale ALLOWED_DRIFTS entries can't be auto-fixed (require source code edit),
        // so they are reported as remaining errors.
        const remainingErrors: string[] = [...staleErrors];

        for (const dir of workspaceDirs) {
            const pkgPath = join(dir, 'package.json');

            const rawContent = readFileSync(pkgPath, 'utf-8');

            const pkg: PackageJson = JSON.parse(rawContent) as PackageJson;
            let modified = false;

            for (const depType of ['dependencies', 'devDependencies'] as const) {
                const deps = pkg[depType];

                if (deps === undefined) continue;

                for (const [name, currentVersion] of Object.entries(deps)) {
                    const canonical = canonicalVersions.get(name);

                    if (canonical !== undefined && currentVersion !== canonical) {
                        (deps as Record<string, string>)[name] = canonical;
                        modified = true;
                    }
                }
            }

            if (modified) {
                writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n', 'utf-8');
            }
        }

        // Re-verify after fix to report any remaining issues
        const updatedDepMap = collectDependencyVersions(workspaceDirs);
        const updatedDrifts = findVersionDrifts(updatedDepMap);

        for (const [depName, occurrences] of updatedDrifts) {
            remainingErrors.push(formatDriftError(depName, occurrences));
        }

        return Promise.resolve(remainingErrors);
    },
};
