/* eslint-disable camelcase */

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const rootPath = path.join(__dirname, '..', '..');
const packagesPath = path.join(rootPath, 'packages');

const packages = fs.readdirSync(packagesPath, {
    encoding: 'utf-8',
});

const ROOT = path.join(__dirname, '..', '..');

const updateNeeded = [];
const errors = [];

const checkPackageDependencies = packageName => {
    const rawPackageJSON = fs.readFileSync(
        path.join(ROOT, 'packages', packageName, 'package.json'),
    );

    const packageJSON = JSON.parse(rawPackageJSON);
    const { dependencies, devDependencies } = packageJSON;

    const allDependnecies = { ...dependencies, ...devDependencies };
    if (!Object.keys(allDependnecies)) {
        return;
    }

    Object.entries(allDependnecies).forEach(([dependency, version]) => {
        // is not a dependency released from monorepo. we don't care
        if (!dependency.startsWith('@trezor')) {
            return;
        }

        const [_prefix, name] = dependency.split('/');
        const PACKAGE_PATH = path.join(ROOT, 'packages', name);
        // check local package
        const packResultRaw = child_process.spawnSync('npm', ['pack', '--dry-run', '--json'], {
            encoding: 'utf-8',
            cwd: PACKAGE_PATH,
        }).stdout;

        const packResultJSON = JSON.parse(packResultRaw);
        const localChecksum = packResultJSON[0].shasum;

        // check remote package
        const { stderr, stdout: viewResultRaw } = child_process.spawnSync(
            'npm',
            ['view', '--json'],
            {
                encoding: 'utf-8',
                cwd: PACKAGE_PATH,
            },
        );

        if (stderr) {
            errors.push(name);
            return;
        }

        const viewResultJSON = JSON.parse(viewResultRaw);
        if (viewResultJSON.error) {
            return;
        }

        const remoteChecksum = viewResultJSON[dependency].dist.shasum;

        if (localChecksum !== remoteChecksum) {
            // if the checked dependency is already in the array, remove it and push it to the end of array
            // this way, the final array should be sorted in order in which that dependencies listed there
            // should be released from the last to the first
            const index = updateNeeded.findIndex(lib => lib === dependency);
            if (index > -1) {
                updateNeeded.splice(index, 1);
            }
            updateNeeded.push(dependency);
        }

        checkPackageDependencies(name);
    });

    return {
        update: updateNeeded,
        errors,
    };
};

module.exports = { checkPackageDependencies };
