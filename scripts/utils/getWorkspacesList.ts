import { A, D, pipe } from '@mobily/ts-belt';
import { execSync } from 'child_process';
import { getAffectedPackages } from './getAffectedPackages';

type WorkspacePackageName = string;
export type WorkspaceItem = {
    location: string;
    name: WorkspacePackageName;
    workspaceDependencies?: WorkspacePackageName[];
    mismatchedWorkspaceDependencies?: WorkspacePackageName[];
};

let workspacesList: Record<WorkspacePackageName, WorkspaceItem> | null = null;
export const getWorkspacesList = (): Record<WorkspacePackageName, WorkspaceItem> => {
    if (workspacesList) {
        // Cache the results because this could be slow and it's always the same
        return workspacesList;
    }

    const rawList = execSync('yarn workspaces list --json --verbose')
        .toString()
        .replaceAll('}', '},');
    const indexOfLastComma = rawList.lastIndexOf(',');
    const validJsonString = `[ ${
        rawList.slice(0, indexOfLastComma) + rawList.slice(indexOfLastComma + 1)
    } ]`;
    const workspaces = pipe(
        JSON.parse(validJsonString),
        (A.sortBy as any)((current: WorkspaceItem, next: WorkspaceItem) =>
            current?.name > next?.name ? 1 : -1,
        ),
        A.map((workspace: WorkspaceItem) => [workspace.name, workspace] as const),
        D.fromPairs,
    );

    workspacesList = workspaces;

    return workspaces;
};

export const getAffectedWorkspaces = (): WorkspaceItem[] => {
    const affectedPackages = getAffectedPackages();
    const workspaces = getWorkspacesList();

    return affectedPackages
        .map(packageName => workspaces[packageName])
        .filter(workspace => !!workspace);
};
