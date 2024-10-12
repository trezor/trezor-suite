/*
    This script fixes dependencies in package.json.
    1. It removes unused dependencies.
    2. It adds missing dependencies
        - if a dependency is used in the monorepo, but not directly in any of our packages, it adds it to package.json with the workspace:* version.
        - if a dependency is used in the monorepo, but not in any of our packages, it gets the latest version that is used anywhere in node_modules.
        - if dependency is not used anywhere in the monorepo, it gets the latest version from npm.
*/

import chalk from 'chalk';
import depcheck from 'depcheck';
import fs from 'node:fs';
import path from 'node:path';
import { formatObjectToJson } from './utils/getPrettierConfig';
import { getWorkspacesList, WorkspaceItem } from './utils/getWorkspacesList';
import { getLatestVersionFromNpm, getPackageVersionInMonorepo } from './utils/packageVersionsUtils';

const { defaultOptions } = require('depcheck/dist/constants');

if (!process.env.PROJECT_CWD || !process.env.INIT_CWD) {
    console.error(
        'PROJECT_CWD or INIT_CWD environment variable is not set. This variable should be automatically set by Yarn.',
    );
    process.exit(1);
}

const allowNpmInstall = process.argv.includes('-i') || process.argv.includes('--install');
const isVerifyOnly = process.argv.includes('--verify') || process.env.CI;

// If there arg --verify, only run depcheck in shell and pipe output to stdout
// const isVerifyOnly = process.argv.includes('--verify');

const options = {
    ...defaultOptions,
    skipMissing: false, // skip calculation of missing dependencies
    ignorePatterns: [
        ...defaultOptions.ignorePatterns,
        'dist',
        'build',
        'coverage',
        'public',
        'lib',
        'libDev',
        '*.json',
        'tsconfig.json',
        'tsconfig.lib.json',
        // webpack configs
        '**/webpack.config.js',
        '**/webpack.config.ts',
        '**/*.webpack.config.js',
        '**/*.webpack.config.ts',
    ],
    ignoreMatches: [
        ...defaultOptions.ignoreMatches,
        // alias that is used in @trezor/suite package
        'src',
        // invity-api is package only for typescript types and it's imported from @types/invity-api
        'invity-api',
    ],
} satisfies depcheck.Options;

const transformPathToRelative = (filePath: string) => {
    return filePath.replace(process.cwd(), '.').replace(/^\//, '');
};
// Execute the command and split the output by newlines
const ourWorkspaces = getWorkspacesList();
const ourPackages = Object.keys(ourWorkspaces);

const ourPackagesScopes = new Set(
    ourPackages.map(pkg => pkg.split('/')[0]).filter(pkg => pkg.startsWith('@')),
);

async function fixDependencies(workspace: WorkspaceItem) {
    const workspaceFullPath = path.join(process.env.PROJECT_CWD!, workspace.location);
    const packageJsonPath = path.join(workspaceFullPath, 'package.json');
    const originalPackageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const originalPackageJson = JSON.parse(originalPackageJsonContent);

    console.log('Running depcheck for', workspace.name);
    const result = await depcheck(workspaceFullPath, {
        ...options,
        package: originalPackageJson,
    });

    const newPackageJson = JSON.parse(originalPackageJsonContent);

    if (isVerifyOnly) {
        if (result.dependencies.length === 0 && Object.keys(result.missing).length === 0) {
            console.log(chalk.green('All dependencies are up to date.'));
            process.exit(0);
        }

        if (result.dependencies.length > 0) {
            console.log(chalk.red('Unused dependencies:'));
            result.dependencies.forEach(depName => {
                console.log(chalk.red(` - ${depName}`));
            });
        }
        if (Object.keys(result.missing).length > 0) {
            console.log(chalk.red('Missing dependencies:'));
            Object.keys(result.missing).forEach(depName => {
                console.log(chalk.red(` - ${depName}`));
            });
        }
        process.exit(1);
    }

    result.dependencies.forEach(depName => {
        // remove dep from package.json
        console.log(
            chalk.red(`${chalk.bold(depName)} - Removing unused dependency from package.json.`),
        );
        console.log('');
        delete newPackageJson.dependencies[depName];
    });

    // remove self from missing deps in case package references itself
    delete result.missing[newPackageJson.name];

    const missingDeps = Object.keys(result.missing);

    missingDeps.forEach(depName => {
        if (depName === newPackageJson.name) return;

        const files = result.missing[depName];

        console.error(chalk.red(`${chalk.bold(depName)} is missing in package.json.`));
        console.log(`Used in ${files.length} files:`);
        files.forEach(file => {
            console.log(` - ${depName}/${transformPathToRelative(file)}`);
        });

        let version = null;
        const depScope = depName.startsWith('@') ? depName.split('/')[0] : null;
        if (depScope && ourPackagesScopes.has(depScope)) {
            if (ourPackages.includes(depName)) {
                // add dep to package.json
                version = 'workspace:*';
            } else {
                console.error(
                    chalk.red(
                        `Using dependency with our scope ${depName} but this package doesn't exist in monorepo. This is probably a mistake, verify package name.`,
                    ),
                );
                process.exit(1);
            }
        } else {
            const versionFromMonorepo = getPackageVersionInMonorepo(depName);
            if (versionFromMonorepo) {
                console.log(
                    chalk.green(
                        `${chalk.bold(depName)}@${chalk.bold(versionFromMonorepo)} - adding to package.json ${chalk.bold(
                            '(version from monorepo)',
                        )}`,
                    ),
                );
                version = versionFromMonorepo;
            } else {
                if (allowNpmInstall) {
                    console.log(
                        chalk.red(
                            ` ${chalk.bold(depName)} - no version of found in monorepo. Getting latest version from NPM.`,
                        ),
                    );
                    const versionFromNpm = getLatestVersionFromNpm(depName);
                    if (versionFromNpm) {
                        console.log(
                            chalk.green(
                                `${chalk.bold(depName)}@${chalk.bold(versionFromNpm)} - adding to package.json ${chalk.bold(
                                    '(version from npm)',
                                )}`,
                            ),
                        );
                        version = versionFromNpm;
                    } else {
                        console.error(
                            chalk.red(
                                `${chalk.bold(depName)} - no version of found in npm. Please add it to package.json manually.`,
                            ),
                        );
                    }
                } else {
                    console.log(
                        chalk.red(
                            `${chalk.bold(depName)} is not installed yet. Please add it using \`yarn add ${depName}\` command or run this script with \`-i\` flag.`,
                        ),
                    );
                }
            }
        }

        if (version) {
            newPackageJson.dependencies = {
                ...newPackageJson.dependencies,
                [depName]: version,
            };
        }
        // empty line
        console.log('');
    });

    fs.writeFileSync(packageJsonPath, await formatObjectToJson(newPackageJson, 2));
}

const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.env.INIT_CWD!, 'package.json'), 'utf8'),
);

fixDependencies({
    name: packageJson.name,
    // WorkspaceItem expects path to be relative to the project root
    location: process.env.INIT_CWD!.replace(process.env.PROJECT_CWD!, ''),
});
