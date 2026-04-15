import chalk from 'chalk';
import fsExtra from 'fs-extra';
import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import sortPackageJson from 'sort-package-json';

import templatePackageJsonWeb from './package-template/package.json';
import templatePackageJsonNative from './package-template-native/package.json';
import { getPrettierConfig } from './utils/getPrettierConfig';
import { getWorkspacesList } from './utils/getWorkspacesList';

const scopes = {
    '@suite-common': {
        path: 'suite-common/',
        templatePath: 'package-template/',
        templatePackageJson: templatePackageJsonWeb,
    },
    '@suite-native': {
        path: 'suite-native/',
        templatePath: 'package-template-native/',
        templatePackageJson: templatePackageJsonNative,
    },
    '@suite': {
        path: 'suite/',
        templatePath: 'package-template/',
        templatePackageJson: templatePackageJsonWeb,
    },
    '@trezor': {
        path: 'packages/',
        templatePath: 'package-template/',
        templatePackageJson: templatePackageJsonWeb,
    },
} as const;

function exitWithErrorMessage(errorMessage: string): never {
    console.error(errorMessage);
    process.exit(1);
}

const isValidScope = (scope: string): scope is keyof typeof scopes =>
    Object.keys(scopes).includes(scope);

// Get the directory of the current file
const currentDir = import.meta.dirname;
const rootDir = path.resolve(currentDir, '..');

(async () => {
    const newPackage = process.argv?.[2];
    if (!newPackage || typeof newPackage !== 'string' || !newPackage.includes('/')) {
        exitWithErrorMessage(
            `${chalk.bold.red('Please enter package scope and name -')} ${chalk.italic.red(
                'yarn generate-package @scope/new-package-name',
            )}`,
        );
    }

    const packageScope = newPackage.split('/')[0];
    const packageName = newPackage.split('/')[1];

    if (!packageScope || !packageName) {
        exitWithErrorMessage(
            chalk.bold.red('Package name must be in the format @scope/package-name'),
        );
    }

    if (!isValidScope(packageScope)) {
        exitWithErrorMessage(
            chalk.bold.red(
                `Invalid scope ${packageScope}. Please use one of the supported scopes: ${Object.keys(
                    scopes,
                ).join(', ')}`,
            ),
        );
    }

    const { path: scopePath, templatePath, templatePackageJson } = scopes[packageScope];
    const packagePath = path.join(rootDir, scopePath, packageName);

    const workspacesNames = Object.keys(getWorkspacesList());
    if (fs.existsSync(packagePath)) {
        exitWithErrorMessage(
            chalk.bold.red(`Folder ${packagePath} already exists! Please choose different name.`),
        );
    }
    if (workspacesNames.includes(newPackage)) {
        exitWithErrorMessage(
            chalk.bold.red(`Package ${newPackage} already exists! Please choose different name.`),
        );
    }

    const packageJson = sortPackageJson({
        ...templatePackageJson,
        name: newPackage,
    });

    const prettierConfig = await getPrettierConfig();
    const serializeConfig = (config: Record<string, unknown>) =>
        prettier.format(JSON.stringify(config).replace(/\\\\/g, '/'), prettierConfig);
    try {
        const templateSourcePath = path.join(currentDir, templatePath);
        fsExtra.copySync(templateSourcePath, packagePath);
        fs.writeFileSync(
            path.join(packagePath, 'package.json'),
            await serializeConfig(packageJson),
        );
    } catch (error) {
        exitWithErrorMessage(`${error}\n${chalk.bold.red('Package creation failed.')}`);
    }

    console.log(chalk.bold.green(`Package ${packageName} successfully created!`));
})();
