import chalk from 'chalk';
import fs from 'fs';
import fsExtra from 'fs-extra';
import prettier from 'prettier';
import sortPackageJson from 'sort-package-json';

import templatePackageJsonWeb from './package-template/package.json';
import templatePackageJsonNative from './package-template-native/package.json';
// todo: calling yarn generate-package failed on not resolving destructuring imports. default imports seem to work.
import import1 from './utils/getPrettierConfig';
import import2 from './utils/getWorkspacesList';

const { getPrettierConfig } = import1;
const { getWorkspacesList } = import2;

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
    '@trezor': {
        path: 'packages/',
        templatePath: 'package-template/',
        templatePackageJson: templatePackageJsonWeb,
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

    const { path, templatePath, templatePackageJson } = scopes[packageScope];
    const packagePath = `${path}/${packageName}`;

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
        fsExtra.copySync(`./scripts/${templatePath}`, packagePath);
        fs.writeFileSync(`${packagePath}/package.json`, await serializeConfig(packageJson));
    } catch (error) {
        exitWithErrorMessage(`${error}\n${chalk.bold.red('Package creation failed.')}`);
    }

    console.log(chalk.bold.green(`Package ${packageName} successfully created!`));
})();
