import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

type YarnWorkspaceInfo = {
    readonly name: string;
    readonly location: string;
};

export type WorkspaceEntry = {
    readonly name: string;
    readonly dir: string;
};

const workspacesCache = new Map<string, ReadonlyArray<WorkspaceEntry>>();

export const listAllWorkspaces = (repoRoot: string): ReadonlyArray<WorkspaceEntry> => {
    const cached = workspacesCache.get(repoRoot);

    if (cached !== undefined) {
        return cached;
    }

    const rawOutput = execFileSync('yarn', ['workspaces', 'list', '--json'], {
        cwd: repoRoot,
        encoding: 'utf-8',
    });

    const workspaces = rawOutput
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as YarnWorkspaceInfo)
        .map(workspace => ({
            name: workspace.name,
            dir: resolve(repoRoot, workspace.location),
        }));

    workspacesCache.set(repoRoot, workspaces);

    return workspaces;
};

export const readPackageJson = <T>(workspaceDir: string): T =>
    JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf-8')) as T;
