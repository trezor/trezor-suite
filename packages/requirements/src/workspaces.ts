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
const workspaceDirectoryMapCache = new Map<string, ReadonlyMap<string, string>>();

export const listAllWorkspaces = (repoRoot: string): ReadonlyArray<WorkspaceEntry> => {
    const cacheKey = resolve(repoRoot);
    const cached = workspacesCache.get(cacheKey);

    if (cached !== undefined) {
        return cached;
    }

    let rawOutput: string;

    try {
        rawOutput = execFileSync('yarn', ['workspaces', 'list', '--json'], {
            cwd: cacheKey,
            encoding: 'utf-8',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        throw new Error(`Failed to list workspaces in ${cacheKey}: ${message}`);
    }

    const workspaces = rawOutput
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as YarnWorkspaceInfo)
        .map(workspace => ({
            name: workspace.name,
            dir: resolve(cacheKey, workspace.location),
        }));

    workspacesCache.set(cacheKey, workspaces);

    return workspaces;
};

export const getWorkspaceDirectoryMap = (repoRoot: string): ReadonlyMap<string, string> => {
    const cacheKey = resolve(repoRoot);
    const cached = workspaceDirectoryMapCache.get(cacheKey);

    if (cached !== undefined) {
        return cached;
    }

    const map = new Map(
        listAllWorkspaces(cacheKey).map(workspace => [workspace.name, workspace.dir]),
    );

    workspaceDirectoryMapCache.set(cacheKey, map);

    return map;
};

export const readPackageJson = <T>(workspaceDir: string): T =>
    JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf-8')) as T;
