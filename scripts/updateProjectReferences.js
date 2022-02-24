import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prettier from 'prettier';
import minimatch from 'minimatch';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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

    const serializeConfig = config =>
        prettier.format(JSON.stringify(config).replace(/\\\\/g, '/'), prettierConfig);

    const workspaces = JSON.parse(
        JSON.parse(execSync('yarn workspaces --json info').toString()).data,
    );

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
                console.error('Error while parsing file: ', workspaceConfigPath);
                process.exit(1);
            }

            const nextWorkspaceReferences = typingPaths.map(typingPath => ({
                path: path.relative(workspacePath, path.resolve(process.cwd(), typingPath)),
            }));

            Object.values(workspace.workspaceDependencies).forEach(dependencyName => {
                const dependencyPath = path.resolve(
                    process.cwd(),
                    workspaces[dependencyName].location,
                );
                const relativeDependencyPath = path.relative(workspacePath, dependencyPath);

                if (relativeDependencyPath) {
                    nextWorkspaceReferences.push({ path: relativeDependencyPath });
                } else {
                    console.warn(
                        `${dependencyName} might be referencing itself in package.json#dependencies.`,
                    );
                }
            });

            if (isTesting) {
                if (
                    serializeConfig(workspaceConfig.references) !==
                    serializeConfig(nextWorkspaceReferences)
                ) {
                    console.error(
                        `TypeScript project references in ${workspace.location} are inconsistent with package.json#dependencies.`,
                        `Run "yarn update-project-references" to fix them.`,
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
