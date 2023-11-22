import fsExtra from 'fs-extra';
import fs from 'fs';
import sortPackageJson from 'sort-package-json';
import prettier from 'prettier';
import chalk from 'chalk';

import templatePackageJson from './package-template/package.json';
import { getPrettierConfig } from './utils/getPrettierConfig';
import { getWorkspacesList } from './utils/getWorkspacesList';

const templatePath = './scripts/package-template';

const scopes = {
    '@suite-common': {
        path: 'suite-common/',
        templatePath: 'package-template/',
    },
    '@suite-native': {
        path: 'suite-native/',
        templatePath: 'package-template/',
    },
    '@trezor': {
        path: 'packages/',
        templatePath: 'package-template/',
    },
};

const exitWithErrorMessage = errorMessage => {
    console.error(errorMessage);
    process.exit(1);
};

(async () => {
    const newPackage = process.argv?.[2];
    if (!newPackage || typeof newPackage !== 'string' || !newPackage.includes('/')) {
        exitWithErrorMessage(
            `${chalk.bold.red('Please enter package scope and name -')} ${chalk.italic.red(
                'yarn generate-package @scope/new-package-name',
            )}`,
        );
    }

    const [packageScope, packageName] = newPackage.split('/');

    const validScopes = Object.keys(scopes);
    if (!validScopes.includes(packageScope)) {
        exitWithErrorMessage(
            chalk.bold.red(
                `Invalid scope ${packageScope}. Please use one of the supported scopes: ${validScopes.join(
                    ', ',
                )}`,
            ),
        );
    }

    const packagePath = `${scopes[packageScope].path}/${packageName}`;
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
    const serializeConfig = config =>
        prettier.format(JSON.stringify(config).replace(/\\\\/g, '/'), prettierConfig);

    try {
        fsExtra.copySync(templatePath, packagePath);
        fs.writeFileSync(`${packagePath}/package.json`, await serializeConfig(packageJson));
    } catch (error) {
        exitWithErrorMessage(`${error}\n${chalk.bold.red('Package creation failed.')}`);
    }

    console.log(chalk.bold.green(`Package ${packageName} successfully created!`));
})();
