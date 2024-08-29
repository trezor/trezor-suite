/**
 * yarn tsx check-npm-dependencies.ts <package_name> <semver>
 *
 * This script checks the dependencies for the specified package to ensure they match expected criteria.
 * It is used to verify the output of scripts/ci/connect-bump-versions.ts. */
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const readdir = promisify(fs.readdir);
const { checkPackageDependencies } = require('./helpers');

const rootPath = path.join(__dirname, '..', '..');
const packagesPath = path.join(rootPath, 'packages');

const args = process.argv.slice(2);

if (args.length < 2)
    throw new Error('Usage: yarn tsx check-npm-dependencies.ts <packageName> <semanticVersion>');

const [packageName, semanticVersion] = args;
const allowedSemvers = ['patch', 'prepatch', 'minor', 'preminor', 'prerelease'];
if (!allowedSemvers.includes(semanticVersion)) {
    throw new Error(
        `Provided semanticVersion '${semanticVersion}' must be one of ${allowedSemvers.join(', ')}`,
    );
}

const currentDeploymentType = ['prepatch', 'preminor', 'prerelease'].includes(semver)
    ? 'canary'
    : 'stable';

(async () => {
    const packages = await readdir(packagesPath, {
        encoding: 'utf-8',
    });

    if (!packages.includes(packageName)) {
        throw new Error(`provided package name: ${packageName} must be one of ${packages}`);
    }

    const checkResult = await checkPackageDependencies(packageName, currentDeploymentType);

    if (checkResult.errors.length > 0) {
        const errorMessage = `Deps error. one of the dependencies likely needs to be published for the first time: ${checkResult.errors.join(
            ', ',
        )}`;
        throw Error(errorMessage);
    }

    console.log('checkResult', checkResult);
    console.log(
        `All dependencies for ${packageName} are correct for a ${currentDeploymentType} deployment.`,
    );
})();
