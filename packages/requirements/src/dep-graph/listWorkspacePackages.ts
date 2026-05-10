// Reads the full set of yarn workspace packages once and returns a
// `Map<packageName, { dir, packageJson }>`. Three other requirements
// (`requireConnectPublicDependencies`, `requireForbiddenDeps`,
// `requireUnifiedDependencyVersions`) re-implement this pattern; #27448
// tracks their migration to this helper.
//
// Result is cached per `repoRoot` — the workspace layout doesn't change
// during a single CI run.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type YarnWorkspaceInfo = {
    readonly name: string;
    readonly location: string;
};

export type WorkspacePackageJson = {
    readonly name?: string;
    readonly dependencies?: Record<string, string>;
    readonly optionalDependencies?: Record<string, string>;
    readonly peerDependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
};

export type WorkspacePackage = {
    /** Absolute path to the workspace directory. */
    readonly dir: string;
    /** Path relative to `repoRoot`, slash-separated (e.g. `packages/connect`, `suite/e2e`). */
    readonly location: string;
    readonly packageJson: WorkspacePackageJson;
};

const cache = new Map<string, ReadonlyMap<string, WorkspacePackage>>();

export const listWorkspacePackages = (repoRoot: string): ReadonlyMap<string, WorkspacePackage> => {
    const cached = cache.get(repoRoot);
    if (cached !== undefined) {
        return cached;
    }

    const rawOutput = execFileSync('yarn', ['workspaces', 'list', '--json'], {
        cwd: repoRoot,
        encoding: 'utf-8',
    });

    const result = new Map<string, WorkspacePackage>();
    for (const line of rawOutput.trim().split('\n').filter(Boolean)) {
        const workspace = JSON.parse(line) as YarnWorkspaceInfo;
        const location = workspace.location.replaceAll('\\', '/');
        const dir = join(repoRoot, location);
        const packageJson = JSON.parse(
            readFileSync(join(dir, 'package.json'), 'utf-8'),
        ) as WorkspacePackageJson;

        if (packageJson.name) {
            result.set(packageJson.name, { dir, location, packageJson });
        }
    }

    cache.set(repoRoot, result);

    return result;
};
