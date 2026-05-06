import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { typedObjectKeys } from '@trezor/utils';

import type { Requirement } from '../Requirement';

const FOUNDATIONAL_PACKAGES = [
    '@trezor/utils',
    '@trezor/device-utils',
    '@trezor/protobuf',
    '@trezor/protocol',
    '@trezor/schema-utils',
    '@trezor/type-utils',
    '@trezor/utxo-lib',
    '@trezor/blockchain-link',
    '@trezor/blockchain-link-types',
    '@trezor/device-authenticity',
    '@trezor/transport',
] as const;

const CONNECT_TIER_PACKAGES = [
    '@trezor/connect-common',
    '@trezor/connect',
    '@trezor/connect-web',
    '@trezor/connect-webextension',
] as const;

const DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
] as const;

const REASON =
    'Foundational packages must not depend on connect-tier (would create dependency cycle).';

type DependencyField = (typeof DEPENDENCY_FIELDS)[number];

type PackageJson = {
    readonly [K in DependencyField]?: Record<string, string>;
};

type YarnWorkspaceInfo = {
    readonly name: string;
    readonly location: string;
};

const listWorkspaceDirectories = (repoRoot: string): ReadonlyMap<string, string> => {
    const rawOutput = execFileSync('yarn', ['workspaces', 'list', '--json'], {
        cwd: repoRoot,
        encoding: 'utf-8',
    });

    return new Map(
        rawOutput
            .trim()
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line) as YarnWorkspaceInfo)
            .map(workspace => [workspace.name, join(repoRoot, workspace.location)]),
    );
};

const readPackageJson = (workspaceDir: string): PackageJson =>
    JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf-8')) as PackageJson;

const collectViolations = (
    foundationalPackage: string,
    packageJson: PackageJson,
    connectTierSet: ReadonlySet<string>,
): ReadonlyArray<string> => {
    const violations: string[] = [];

    for (const field of DEPENDENCY_FIELDS) {
        for (const dependencyName of typedObjectKeys(packageJson[field] ?? {})) {
            if (!connectTierSet.has(dependencyName)) {
                continue;
            }

            violations.push(
                `${foundationalPackage}: ${JSON.stringify(dependencyName)} is forbidden in ${field}. Reason: ${REASON}`,
            );
        }
    }

    return violations;
};

export const requireNoConnectTierInFoundational: Requirement<'repo'> = {
    name: 'no-connect-tier-in-foundational',
    scope: 'repo',
    verify: ({ repoRoot }) => {
        const workspaceDirectories = listWorkspaceDirectories(repoRoot);
        const connectTierSet = new Set<string>(CONNECT_TIER_PACKAGES);
        const errors: string[] = [];

        for (const foundationalPackage of FOUNDATIONAL_PACKAGES) {
            const workspaceDir = workspaceDirectories.get(foundationalPackage);

            if (workspaceDir === undefined) {
                errors.push(
                    `${foundationalPackage}: foundational package is not present in the workspace list.`,
                );
                continue;
            }

            errors.push(
                ...collectViolations(
                    foundationalPackage,
                    readPackageJson(workspaceDir),
                    connectTierSet,
                ),
            );
        }

        return Promise.resolve(errors);
    },
};
