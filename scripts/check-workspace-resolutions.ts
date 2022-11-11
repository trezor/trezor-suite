import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

import { getWorkspacesList } from './utils/getWorkspacesList';

(() => {
    const logLabel = chalk.green('Workspace resolutions checked in');
    console.time(logLabel);
    const workspaces = getWorkspacesList();
    const packageNames = Object.values(workspaces).reduce<Record<string, string>>(
        (packages, workspace) => ({ ...packages, [workspace.location]: workspace.name }),
        {},
    );

    Object.keys(workspaces).forEach(workspaceName => {
        const workspace = workspaces[workspaceName];
        const packageJSON = fs.readFileSync(path.join(workspace.location, 'package.json'), {
            encoding: 'utf-8',
        });

        const { dependencies, devDependencies } = JSON.parse(packageJSON);
        const listOfWorkspaceDependencies = { ...dependencies, ...devDependencies };

        workspace.workspaceDependencies.forEach(workspaceDependency => {
            const dependencyName = packageNames[workspaceDependency];
            const dependencyVersion = listOfWorkspaceDependencies[dependencyName];

            if (!dependencyVersion.startsWith('workspace:')) {
                console.error(
                    chalk.red(
                        `${workspaceName} has a dependency on ${dependencyName} with version ${dependencyVersion}.`,
                    ),
                    chalk.bold.red(`Use "workspace:${dependencyVersion}" instead!`), // see https://yarnpkg.com/features/workspaces#workspace-ranges-workspace for explanation
                );
                process.exit(1);
            }
        });
    });
    console.timeEnd(logLabel);
})();
