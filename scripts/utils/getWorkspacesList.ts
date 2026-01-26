import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { A, D, pipe } = require('@mobily/ts-belt');

type WorkspacePackageName = string;
type WorkspaceItem = {
    location: string;
    name: WorkspacePackageName;
    workspaceDependencies: WorkspacePackageName[];
    mismatchedWorkspaceDependencies: WorkspacePackageName[];
};

export const getWorkspacesList = (): Record<WorkspacePackageName, WorkspaceItem> => {
    const rawList = execSync('yarn workspaces list --json --verbose')
        .toString()
        .replaceAll('}', '},');
    const indexOfLastComma = rawList.lastIndexOf(',');
    const validJsonString = `[ ${
        rawList.slice(0, indexOfLastComma) + rawList.slice(indexOfLastComma + 1)
    } ]`;
    const workspaces = pipe(
        JSON.parse(validJsonString),
        A.sort((current: WorkspaceItem, next: WorkspaceItem) =>
            current?.name > next?.name ? 1 : -1,
        ),
        A.map((workspace: WorkspaceItem) => [workspace.name, workspace] as const),
        D.fromPairs,
    );

    return workspaces;
};
