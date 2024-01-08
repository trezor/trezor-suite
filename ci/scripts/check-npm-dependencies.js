/**
 * node check-npm-dependencies.js <package_name>
 */
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const readdir = promisify(fs.readdir);
const { checkPackageDependencies } = require('./helpers');

const rootPath = path.join(__dirname, '..', '..');
const packagesPath = path.join(rootPath, 'packages');

const args = process.argv.slice(2);

if (args.length < 1) throw new Error('Check npm dependencies requires 1 parameter: package name');
const [packageName] = args;

(async () => {
    const packages = await readdir(packagesPath, {
        encoding: 'utf-8',
    });

    if (!packages.includes(packageName)) {
        throw new Error(`provided package name: ${packageName} must be one of ${packages}`);
    }

    const checkResult = await checkPackageDependencies(packageName);

    if (checkResult.errors.length > 0) {
        const errorMessage = `Deps error. one of the dependencies likely needs to be published for the first time: ${checkResult.errors.join(
            ', ',
        )}`;
        throw Error(errorMessage);
    }
})();
