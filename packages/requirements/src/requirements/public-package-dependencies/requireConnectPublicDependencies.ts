import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { type PackageJson, readJson } from '@trezor/node-utils';

import type { Requirement } from '../Requirement';
import {
    type WorkspacePackage,
    collectProdWorkspaceClosure,
    collectWorkspacePackages,
} from '../connectClosure';

type Snapshot = {
    readonly prod: ReadonlyArray<string>;
};

const TARGET_PACKAGES = [
    '@trezor/connect',
    '@trezor/connect-web',
    '@trezor/connect-mobile',
    '@trezor/connect-webextension',
] as const;

const SNAPSHOT_DIR = join(
    'packages',
    'requirements',
    'src',
    'requirements',
    'public-package-dependencies',
    '__snapshots__',
);

const collectDependencyNames = (
    collector: Set<string>,
    deps: Record<string, string> | undefined,
) => {
    for (const [name] of Object.entries(deps ?? {})) {
        collector.add(name);
    }
};

// Optional peer dependencies (e.g. env-utils' react-native / expo-* native modules) are not part
// of a package's prod dependency surface — they are only required in specific host environments.
const getRequiredPeerDependencies = (packageJson: PackageJson) =>
    Object.fromEntries(
        Object.entries(packageJson.peerDependencies ?? {}).filter(
            ([name]) => !packageJson.peerDependenciesMeta?.[name]?.optional,
        ),
    );

const createSnapshot = (
    target: string,
    workspacePackages: Map<string, WorkspacePackage>,
): Snapshot => {
    const prodClosure = collectProdWorkspaceClosure([target], workspacePackages);
    const prodDependencies = new Set<string>(prodClosure);

    for (const packageName of prodClosure) {
        const pkg = workspacePackages.get(packageName);
        if (!pkg) continue;

        const { packageJson } = pkg;

        collectDependencyNames(prodDependencies, packageJson.dependencies);
        collectDependencyNames(prodDependencies, packageJson.optionalDependencies);
        collectDependencyNames(prodDependencies, getRequiredPeerDependencies(packageJson));
    }

    return {
        prod: [...prodDependencies].sort(),
    };
};

const snapshotFileName = (packageName: string) => `${packageName.replace('@trezor/', '')}.json`;

const stringifySnapshot = (snapshot: Snapshot) => `${JSON.stringify(snapshot, null, 4)}\n`;

const validateSnapshots = ({ repoRoot, write }: { repoRoot: string; write: boolean }) => {
    const workspacePackages = collectWorkspacePackages(repoRoot);
    const snapshotDir = join(repoRoot, SNAPSHOT_DIR);

    if (write) {
        mkdirSync(snapshotDir, { recursive: true });
    }

    const errors: string[] = [];

    for (const target of TARGET_PACKAGES) {
        if (!workspacePackages.has(target)) {
            errors.push(`Target package not found in workspaces: ${target}`);

            continue;
        }

        const expected = createSnapshot(target, workspacePackages);
        const expectedText = stringifySnapshot(expected);
        const filePath = join(snapshotDir, snapshotFileName(target));

        if (write) {
            writeFileSync(filePath, expectedText, 'utf8');

            continue;
        }

        try {
            const current = readJson<Snapshot>(filePath);
            const currentText = stringifySnapshot(current);

            if (currentText !== expectedText) {
                errors.push(
                    `${SNAPSHOT_DIR}/${snapshotFileName(target)} is outdated. Run requirements:fix --only=connect-public-dependencies.`,
                );
            }
        } catch {
            errors.push(
                `${SNAPSHOT_DIR}/${snapshotFileName(target)} is missing or invalid JSON. Run requirements:fix --only=connect-public-dependencies.`,
            );
        }
    }

    return errors;
};

export const requireConnectPublicDependencies: Requirement<'repo'> = {
    name: 'connect-public-dependencies',
    scope: 'repo',
    verify: ({ repoRoot }) => Promise.resolve(validateSnapshots({ repoRoot, write: false })),
    fix: ({ repoRoot }) => Promise.resolve(validateSnapshots({ repoRoot, write: true })),
};
