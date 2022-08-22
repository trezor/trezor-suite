import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prettier from 'prettier';
import minimatch from 'minimatch';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import tsBelt from '@mobily/ts-belt';

const { A, D, pipe } = tsBelt;

const getWorkspaceList = () => {
    const rawList = execSync('yarn workspaces list --json --verbose')
        .toString()
        .replaceAll('}', '},');
    const indexOfLastComma = rawList.lastIndexOf(',');
    const validJsonString = `[ ${
        rawList.slice(0, indexOfLastComma) + rawList.slice(indexOfLastComma + 1)
    } ]`;
    const workspaces = pipe(
        JSON.parse(validJsonString),
        A.sortBy((current, next) => (current?.name > next?.name ? 1 : -1)),
        A.map(workspace => [workspace.name, workspace]),
        D.fromPairs,
    );

    return workspaces;
};

(async () => {
    const { argv } = yargs(hideBin(process.argv))
        .array('read-only')
        .array('ignore')
        .array('typings')
        .boolean('test');

    const readOnlyGlobs = argv.readOnly || [];
    const ignoreGlobs = argv.ignore || [];
    const typingPaths = argv.typings || [];
    const isTesting = argv.test || false;

    const nextRootReferences = [];

    const prettierConfigPath = await prettier.resolveConfigFile();
    const prettierConfig = {
        ...(await prettier.resolveConfig(prettierConfigPath)),
        parser: 'json',
        printWidth: 50,
    };

    const serializeConfig = config => {
        try {
            return prettier.format(JSON.stringify(config).replace(/\\\\/g, '/'), prettierConfig);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    };

    const workspaces = getWorkspaceList();

    // NOTE: Workspace keys must be sorted due to file systems being a part of the equation.
    Object.keys(workspaces)
        .sort()
        .forEach(workspaceName => {
            const workspace = workspaces[workspaceName];

            if (ignoreGlobs.some(path => minimatch(workspace.location, path))) {
                return;
            }

            nextRootReferences.push({
                path: workspace.location,
            });

            const workspacePath = path.resolve(process.cwd(), workspace.location);
            const workspaceConfigPath = path.resolve(workspacePath, 'tsconfig.json');

            const defaultWorkspaceConfig = {
                extends: path.relative(workspacePath, path.resolve(process.cwd(), 'tsconfig.json')),
                compilerOptions: { outDir: './libDev' },
                include: ['.'],
            };

            let workspaceConfig;
            try {
                workspaceConfig = fs.existsSync(workspaceConfigPath)
                    ? JSON.parse(fs.readFileSync(workspaceConfigPath).toString())
                    : defaultWorkspaceConfig;
            } catch {
                console.error(chalk.bold.red('Error while parsing file: '), workspaceConfigPath);
                process.exit(1);
            }

            const nextWorkspaceReferences = typingPaths.map(typingPath => ({
                path: path.relative(workspacePath, path.resolve(process.cwd(), typingPath)),
            }));

            Object.values(workspace.workspaceDependencies).forEach(dependencyLocation => {
                const dependencyPath = path.resolve(process.cwd(), dependencyLocation);
                const relativeDependencyPath = path.relative(workspacePath, dependencyPath);

                if (relativeDependencyPath) {
                    nextWorkspaceReferences.push({ path: relativeDependencyPath });
                } else {
                    console.warn(
                        chalk.yellow(
                            `${dependencyLocation} might be referencing itself in package.json#dependencies.`,
                        ),
                    );
                }
            });

            if (isTesting) {
                if (
                    serializeConfig(workspaceConfig.references ?? []) !==
                    serializeConfig(nextWorkspaceReferences)
                ) {
                    console.error(
                        chalk.red(
                            `TypeScript project references in ${workspace.location} are inconsistent with package.json#dependencies.`,
                        ),
                        chalk.red.bold(`Run "yarn update-project-references" to fix them.`),
                    );

                    process.exit(1);
                }

                return;
            }

            workspaceConfig.references = nextWorkspaceReferences;

            if (!readOnlyGlobs.some(path => minimatch(workspace.location, path))) {
                fs.writeFileSync(workspaceConfigPath, serializeConfig(workspaceConfig));
            }
        });
})();
