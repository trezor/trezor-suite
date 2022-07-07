/* eslint-disable camelcase */
/* eslint-disable no-console */

/**
 * node check-npm-dependencies.js <package_name>
 */

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const packages = fs.readdirSync(path.join(__dirname, '..', '..', 'packages'), {
    encoding: 'utf-8',
});

const args = process.argv.slice(2);

if (args.length < 1) throw new Error('Check npm dependencies requires 1 parameter: package name');
const [packageName] = args;

if (!packages.includes(packageName)) {
    throw new Error(`provided package name: ${packageName} must be one of ${packages}`);
}

const ROOT = path.join(__dirname, '..', '..');

const updateNeeded = [];
const ok = [];

const checkPackageDependencies = packageName => {
    const rawPackageJSON = fs.readFileSync(
        path.join(ROOT, 'packages', packageName, 'package.json'),
    );

    const packageJSON = JSON.parse(rawPackageJSON);
    const { dependencies } = packageJSON;

    if (!dependencies) {
        console.log('this package has no dependencies');
        return;
    }

    console.log('-> ', packageName);

    Object.entries(dependencies).forEach(([dependency, version]) => {
        // is not a dependency released from monorepo. we don't care
        if (!dependency.startsWith('@trezor')) {
            return;
        }

        const [_prefix, name] = dependency.split('/');
        const PACKAGE_PATH = path.join(ROOT, 'packages', name);

        console.log('checking dependency: ', dependency);

        // check local package
        const packResultRaw = child_process.spawnSync('npm', ['pack', '--dry-run', '--json'], {
            encoding: 'utf-8',
            cwd: PACKAGE_PATH,
        }).stdout;

        const packResultJSON = JSON.parse(packResultRaw);

        const localChecksum = packResultJSON[0].shasum;

        console.log('local checksum:  ', localChecksum);

        // check remote package
        const viewResultRaw = child_process.spawnSync('npm', ['view', '--json'], {
            encoding: 'utf-8',
            cwd: PACKAGE_PATH,
        }).stdout;

        const viewResultJSON = JSON.parse(viewResultRaw);

        if (viewResultJSON.error) {
            console.log(viewResultJSON);
            return;
        }

        const remoteChecksum = viewResultJSON.dist.shasum;

        console.log('remote checksum: ', remoteChecksum);

        if (localChecksum !== remoteChecksum) {
            if (!updateNeeded.includes(dependency)) {
                updateNeeded.push(dependency);
            }
        }

        console.log('---> recurring into nested package: ', name);
        checkPackageDependencies(name);
    });
};

checkPackageDependencies(packageName);

if (updateNeeded.length) {
    console.log('='.repeat(20));
    console.log('there are npm dependencies that *MIGHT* need to be released first: ');
    console.log(updateNeeded.join('\n'));
    process.exit(1);
}

console.log('All dependencies are up to date. You may now proceed with @trezor/connect release');
