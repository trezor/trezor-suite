import { join, resolve } from 'node:path';

import { type ExecCliCommandDep } from './execCliCommand';

const ROOT_WORKSPACE_NAME = 'trezor-suite';
const REPO_ROOT_FROM_REQUIREMENTS_WORKSPACE = '../..';

type WorkspaceInfo = {
    readonly name: string;
    readonly dir: string;
};

type YarnWorkspaceInfo = {
    readonly name: string;
    readonly location: string;
};

type GetAffectedWorkspacesResult = {
    readonly repoRoot: string;
    readonly workspaces: ReadonlyArray<WorkspaceInfo>;
};

export type GetAffectedWorkspaces = (cwd: string) => Promise<GetAffectedWorkspacesResult>;

export type GetAffectedWorkspacesDeps = ExecCliCommandDep & { requirementsWorkspaceName: string };

export const createGetAffectedWorkspaces =
    (deps: GetAffectedWorkspacesDeps): GetAffectedWorkspaces =>
    async cwd => {
        const workspacesResult = await deps.execCliCommand({
            command: 'yarn',
            args: ['workspaces', 'list', '--json'],
            options: { cwd },
        });

        if (workspacesResult.exitCode !== 0) {
            throw new Error(`Failed to list workspaces: ${workspacesResult.stderr}`);
        }

        const parsedWorkspaces = workspacesResult.stdout
            .trim()
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line) as YarnWorkspaceInfo);

        const repoRoot = resolve(cwd, REPO_ROOT_FROM_REQUIREMENTS_WORKSPACE);

        const allWorkspaces = parsedWorkspaces
            .filter(workspace => workspace.name !== ROOT_WORKSPACE_NAME)
            .map(workspace => ({
                name: workspace.name,
                dir: join(repoRoot, workspace.location),
            }));

        const nxAffectedResult = await deps.execCliCommand({
            command: 'yarn',
            args: ['nx', 'show', 'projects', '--affected', '--json'],
            options: {
                cwd: repoRoot,
            },
        });

        if (nxAffectedResult.exitCode !== 0) {
            throw new Error(`Failed to determine affected projects: ${nxAffectedResult.stderr}`);
        }

        const trimmedOutput = nxAffectedResult.stdout.trim();

        if (trimmedOutput.length === 0) {
            return {
                repoRoot,
                workspaces: [],
            };
        }

        const affectedWorkspaceNames = JSON.parse(trimmedOutput);

        if (
            !Array.isArray(affectedWorkspaceNames) ||
            !affectedWorkspaceNames.every(project => typeof project === 'string')
        ) {
            throw new Error('Failed to determine affected projects: invalid Nx output format.');
        }

        // if 'requirements' changed, then we need to recheck all workspaces
        if (affectedWorkspaceNames.includes(deps.requirementsWorkspaceName)) {
            return {
                repoRoot,
                workspaces: allWorkspaces,
            };
        }

        // run only affected workspaces
        const workspaces = allWorkspaces.filter(workspace =>
            affectedWorkspaceNames.includes(workspace.name),
        );

        return {
            repoRoot,
            workspaces,
        };
    };
