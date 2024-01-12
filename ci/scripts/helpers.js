/* eslint-disable camelcase */

const fs = require('fs');
const util = require('util');
const path = require('path');
const child_process = require('child_process');

const readFile = util.promisify(fs.readFile);

const { getLocalAndRemoteChecksums } = require('./checkNpmAndLocal');

const rootPath = path.join(__dirname, '..', '..');
const packagesPath = path.join(rootPath, 'packages');

const packages = fs.readdirSync(packagesPath, {
    encoding: 'utf-8',
});

const ROOT = path.join(__dirname, '..', '..');

const updateNeeded = [];
const errors = [];

const checkPackageDependencies = async packageName => {
    const rawPackageJSON = await readFile(path.join(ROOT, 'packages', packageName, 'package.json'));

    const packageJSON = JSON.parse(rawPackageJSON);
    const {
        dependencies,
        // devDependencies // We should ignore devDependencies.
    } = packageJSON;

    if (!dependencies || !Object.keys(dependencies)) {
        return;
    }

    // eslint-disable-next-line no-restricted-syntax
    for await (const [dependency, version] of Object.entries(dependencies)) {
        // is not a dependency released from monorepo. we don't care
        if (!dependency.startsWith('@trezor')) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const [_prefix, name] = dependency.split('/');
        const response = await getLocalAndRemoteChecksums(dependency);
        if (!response.success) {
            // If the package was not found it might be it has not been release yet or other issue, so we include it in errors.
            const index = errors.findIndex(lib => lib === dependency);
            console.log('index', index);
            if (index > -1) {
                errors.splice(index, 1);
            }

            errors.push(dependency);
        } else {
            const { localChecksum, remoteChecksum } = response.data;
            if (localChecksum !== remoteChecksum) {
                // if the checked dependency is already in the array, remove it and push it to the end of array
                // this way, the final array should be sorted in order in which that dependencies listed there
                // should be released from the last to the first.

                const index = updateNeeded.findIndex(lib => lib === dependency);
                console.log('index', index);
                if (index > -1) {
                    updateNeeded.splice(index, 1);
                }
                updateNeeded.push(dependency);
            }

            await checkPackageDependencies(name);
        }
    }

    return {
        update: updateNeeded,
        errors,
    };
};

const exec = (cmd, params) => {
    console.log(cmd, ...params);

    const res = child_process.spawnSync(cmd, params, {
        encoding: 'utf-8',
        cwd: ROOT,
    });
    if (res.status !== 0) {
        console.log(cmd, ...params);
        console.log(res);
    }
    return res;
};

const commit = ({ path, message }) => {
    exec('git', ['add', path]);
    exec('git', ['commit', '-m', `${message}`]);
};

const comment = ({ prNumber, body }) => {
    exec('gh', ['pr', 'comment', `${prNumber}`, '--body', body]);
};

module.exports = { checkPackageDependencies, exec, commit, comment };
