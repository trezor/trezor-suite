import fsExtra from 'fs-extra';
import fs from 'fs';
import sortPackageJson from 'sort-package-json';
import prettier from 'prettier';
import chalk from 'chalk';

import templatePackageJson from './package-template/package.json';
import { getPrettierConfig } from './utils/getPrettierConfig';
import { getWorkspacesList } from './utils/getWorkspacesList';

const templatePath = './scripts/package-template';
const packagesFolder = './packages';

(async () => {
    const packageFolderName = process.argv?.[2];
    if (!packageFolderName) {
        console.error(
            `${chalk.bold.red('Please enter package name -')} ${chalk.italic.red(
                'yarn generate-package your-package-name',
            )}`,
        );
        process.exit(1);
    }

    const packageName = `@trezor/${packageFolderName}`;
    const packagePath = `${packagesFolder}/${packageFolderName}`;

    const workspacesNames = Object.keys(getWorkspacesList());

    if (fs.existsSync(packagePath)) {
        console.error(
            chalk.bold.red(`Folder ${packagePath} already exists! Please choose different name.`),
        );
        process.exit(1);
    }

    if (workspacesNames.includes(packageName)) {
        console.error(
            chalk.bold.red(`Package ${packageName} already exists! Please choose different name.`),
        );
        process.exit(1);
    }

    const packageJson = sortPackageJson({
        ...templatePackageJson,
        name: packageName,
    });

    const prettierConfig = await getPrettierConfig();

    const serializeConfig = config =>
        prettier.format(JSON.stringify(config).replace(/\\\\/g, '/'), prettierConfig);

    try {
        fsExtra.copySync(templatePath, packagePath);
        fs.writeFileSync(`${packagePath}/package.json`, serializeConfig(packageJson));
    } catch (error) {
        console.error(error);
        console.error(chalk.bold.red('Package creation failed.'));
        process.exit(1);
    }

    console.log(chalk.bold.green(`Package ${packageName} successfully created!`));
})();
