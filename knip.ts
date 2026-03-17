import type { KnipConfig } from 'knip';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type WorkspacePackages = string[] | { packages?: string[] };

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

const fileExists = async (filePath: string) => {
    try {
        await access(filePath);

        return true;
    } catch {
        return false;
    }
};

const getWorkspacePatterns = async () => {
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
        workspaces?: WorkspacePackages;
    };

    if (Array.isArray(packageJson.workspaces)) {
        return packageJson.workspaces;
    }

    return packageJson.workspaces?.packages ?? [];
};

const expandWorkspacePattern = async (pattern: string) => {
    if (!pattern.includes('*')) {
        return (await fileExists(path.join(repoRoot, pattern, 'package.json'))) ? [pattern] : [];
    }

    if (!pattern.endsWith('/*')) {
        return [];
    }

    const baseDir = pattern.slice(0, -2);
    const absoluteBaseDir = path.join(repoRoot, baseDir);
    const dirEntries = await readdir(absoluteBaseDir, { withFileTypes: true });
    const workspaceDirs = await Promise.all(
        dirEntries
            .filter(dirEntry => dirEntry.isDirectory())
            .map(async dirEntry => {
                const workspaceDir = path.posix.join(baseDir, dirEntry.name);

                return (await fileExists(path.join(repoRoot, workspaceDir, 'package.json')))
                    ? workspaceDir
                    : null;
            }),
    );

    return workspaceDirs.filter((workspaceDir): workspaceDir is string => workspaceDir !== null);
};

const getWorkspaceDirs = async () => {
    const workspacePatterns = await getWorkspacePatterns();
    const workspaceDirs = await Promise.all(workspacePatterns.map(expandWorkspacePattern));

    return [...new Set(workspaceDirs.flat())].sort();
};

const getWorkspaceKnipConfig = async (workspaceDir: string) => {
    const configPath = path.join(repoRoot, workspaceDir, 'knip.ts');

    if (!(await fileExists(configPath))) {
        return null;
    }

    const configModule = (await import(pathToFileURL(configPath).href)) as {
        default?: object;
        knipConfig?: object;
    };

    return configModule.knipConfig ?? configModule.default ?? null;
};

// eslint-disable-next-line import/no-default-export
export default async function config(): Promise<KnipConfig> {
    const workspaceDirs = await getWorkspaceDirs();
    const workspaceConfigs = await Promise.all(
        workspaceDirs.map(async workspaceDir => {
            const workspaceConfig = await getWorkspaceKnipConfig(workspaceDir);

            return workspaceConfig ? ([workspaceDir, workspaceConfig] as const) : null;
        }),
    );
    const configuredWorkspaces = Object.fromEntries(
        workspaceConfigs.filter(
            (workspaceConfig): workspaceConfig is readonly [string, object] =>
                workspaceConfig !== null,
        ),
    );
    const workspaceConfigEntries = Object.keys(configuredWorkspaces).map(workspaceDir =>
        path.posix.join(workspaceDir, 'knip.ts'),
    );

    return {
        expo: true,
        jest: true,
        mdx: true,
        next: true,
        playwright: true,
        tsx: true,
        vitest: true,
        workspaces: {
            ...(workspaceConfigEntries.length > 0
                ? {
                      '.': {
                          entry: workspaceConfigEntries,
                      },
                  }
                : {}),
            ...configuredWorkspaces,
        },
    };
}
