import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { Requirement } from '../Requirement';

type PackageJson = {
    readonly name?: string;
    readonly dependencies?: Record<string, string>;
    readonly optionalDependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
    readonly peerDependencies?: Record<string, string>;
};

type WorkspacePackage = {
    readonly name: string;
    readonly packageJson: PackageJson;
};

type YarnWorkspaceInfo = {
    readonly location: string;
};

type Snapshot = {
    readonly prod: ReadonlyArray<string>;
};

const TARGET_PACKAGES = [
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

const readJson = <T>(filePath: string): T => JSON.parse(readFileSync(filePath, 'utf8')) as T;

const readPackageJson = (dirPath: string): PackageJson =>
    readJson<PackageJson>(join(dirPath, 'package.json'));

const listWorkspaceDirs = (repoRoot: string): ReadonlyArray<string> => {
    let rawOutput: string;

    try {
        rawOutput = execFileSync('yarn', ['workspaces', 'list', '--json'], {
            cwd: repoRoot,
            encoding: 'utf-8',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        throw new Error(`Failed to list workspaces: ${message}`);
    }

    const parsedWorkspaces = rawOutput
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as YarnWorkspaceInfo);

    const workspaceDirs = new Set<string>([repoRoot]);

    for (const workspace of parsedWorkspaces) {
        workspaceDirs.add(resolve(repoRoot, workspace.location));
    }

    return [...workspaceDirs];
};

const collectWorkspacePackages = (repoRoot: string) => {
    const pkgMap = new Map<string, WorkspacePackage>();
    const workspaceDirs = listWorkspaceDirs(repoRoot);

    for (const dirPath of workspaceDirs) {
        const packageJson = readPackageJson(dirPath);
        if (!packageJson.name) continue;

        pkgMap.set(packageJson.name, {
            name: packageJson.name,
            packageJson,
        });
    }

    return pkgMap;
};

const getWorkspaceDeps = (
    deps: Record<string, string> | undefined,
    workspacePackages: Map<string, WorkspacePackage>,
) =>
    Object.entries(deps ?? {})
        .filter(
            ([name, version]) => version.startsWith('workspace:') && workspacePackages.has(name),
        )
        .map(([name]) => name);

const collectDependencyNames = (
    collector: Set<string>,
    deps: Record<string, string> | undefined,
) => {
    for (const [name] of Object.entries(deps ?? {})) {
        collector.add(name);
    }
};

const createSnapshot = (
    target: string,
    workspacePackages: Map<string, WorkspacePackage>,
): Snapshot => {
    const prodClosure = new Set<string>([target]);
    const prodQueue = [target];

    while (prodQueue.length > 0) {
        const packageName = prodQueue.shift();
        if (!packageName) continue;

        const pkg = workspacePackages.get(packageName);
        if (!pkg) continue;

        const nextWorkspaceDeps = [
            ...getWorkspaceDeps(pkg.packageJson.dependencies, workspacePackages),
            ...getWorkspaceDeps(pkg.packageJson.optionalDependencies, workspacePackages),
        ];

        for (const depName of nextWorkspaceDeps) {
            if (prodClosure.has(depName)) continue;

            prodClosure.add(depName);
            prodQueue.push(depName);
        }
    }

    const prodDependencies = new Set<string>(prodClosure);

    for (const packageName of prodClosure) {
        const pkg = workspacePackages.get(packageName);
        if (!pkg) continue;

        collectDependencyNames(prodDependencies, pkg.packageJson.dependencies);
        collectDependencyNames(prodDependencies, pkg.packageJson.optionalDependencies);
        collectDependencyNames(prodDependencies, pkg.packageJson.peerDependencies);
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
