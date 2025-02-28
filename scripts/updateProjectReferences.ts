import chalk from 'chalk';
import fs from 'fs';
import { minimatch } from 'minimatch';
import path from 'path';
import prettier from 'prettier';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getPrettierConfig } from './utils/getPrettierConfig';
import { getWorkspacesList } from './utils/getWorkspacesList';

(async () => {
    const { argv } = yargs(hideBin(process.argv))
        .array('read-only')
        .array('ignore')
        .array('typings')
        .boolean('test') as any;

    const readOnlyGlobs: string[] = argv.readOnly || [];
    const ignoreGlobs: string[] = argv.ignore || [];
    const typingPaths: string[] = argv.typings || [];
    const isTesting = argv.test || false;

    const prettierConfig = await getPrettierConfig();

    const serializeConfig = (config: any, stringifySpaces?: number) => {
        try {
            return prettier.format(
                JSON.stringify(config, null, stringifySpaces).replace(/\\\\/g, '/'),
                prettierConfig,
            );
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    };

    const parseTSConfigFile = (configPath: string) => {
        try {
            return fs.existsSync(configPath)
                ? JSON.parse(fs.readFileSync(configPath).toString())
                : null;
        } catch {
            console.error(chalk.bold.red('Error while parsing file: '), configPath);
            process.exit(1);
        }
    };

    const isDiffInConfig = async (actualConfig: any[] = [], expectedConfig: any[] = []) =>
        (await serializeConfig(actualConfig)) !== (await serializeConfig(expectedConfig));

    const workspaces = getWorkspacesList();

    // NOTE: Workspace keys must be sorted due to file systems being a part of the equation...
    Object.keys(workspaces)
        .sort()
        .forEach(async workspaceName => {
            const workspace = workspaces[workspaceName];

            if (workspace.location === '.') {
                // Skip root workspace
                return;
            }

            if (ignoreGlobs.some((path: string) => minimatch(workspace.location, path))) {
                return;
            }

            const workspacePath = path.resolve(process.cwd(), workspace.location);
            const workspaceConfigPath = path.resolve(workspacePath, 'tsconfig.json');
            const workspaceLibConfigPath = path.resolve(workspacePath, 'tsconfig.lib.json');

            // actual references of the workspace = typings from argv + parsed package.json (assigned later)
            const nextWorkspaceReferences = typingPaths.map((typingPath: string) => ({
                path: path.relative(workspacePath, path.resolve(process.cwd(), typingPath)),
            }));

            const defaultWorkspaceConfig = {
                extends: path.relative(workspacePath, path.resolve(process.cwd(), 'tsconfig.json')),
                compilerOptions: { outDir: './libDev' },
                include: ['.'],
            };

            // parse tsconfig.json, which should exist, so if it doesn't, assign default config to have it created
            const workspaceConfig =
                parseTSConfigFile(workspaceConfigPath) ?? defaultWorkspaceConfig;

            // parse tsconfig.lib.json, which may not exist, and shall not be created
            const workspaceLibConfig = parseTSConfigFile(workspaceLibConfigPath);

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

            const expectedReferences = nextWorkspaceReferences;
            const expectedLibReferences = nextWorkspaceReferences.filter(
                // Don't include reference to schema-utils due to issues with the @sinclair/typebox library
                // When using a reference it results in incorrect imports
                ({ path }) => path !== '../schema-utils',
            );

            if (isTesting) {
                const isConfigDiff = await isDiffInConfig(
                    workspaceConfig.references,
                    expectedReferences,
                );

                const isConfigLibDiff =
                    workspaceLibConfig !== null &&
                    (await isDiffInConfig(workspaceLibConfig.references, expectedLibReferences));

                if (isConfigDiff || isConfigLibDiff) {
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

            if (readOnlyGlobs.some((path: string) => minimatch(workspace.location, path))) return;

            workspaceConfig.references = expectedReferences;
            fs.writeFileSync(workspaceConfigPath, await serializeConfig(workspaceConfig));

            if (workspaceLibConfig === null) return;
            workspaceLibConfig.references = expectedLibReferences;
            fs.writeFileSync(workspaceLibConfigPath, await serializeConfig(workspaceLibConfig, 2));
        });
})();
