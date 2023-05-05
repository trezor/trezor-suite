/* eslint-disable camelcase */
/**
 * node check-npm-dependencies.js <package_name>
 */

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const rootPath = path.join(__dirname, '..', '..');
const packagesPath = path.join(rootPath, 'packages');

const packages = fs.readdirSync(packagesPath, {
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

const checkPackageDependencies = packageName => {
    const rawPackageJSON = fs.readFileSync(
        path.join(ROOT, 'packages', packageName, 'package.json'),
    );

    const packageJSON = JSON.parse(rawPackageJSON);
    const { dependencies, devDependencies } = packageJSON;

    const allDependnecies = { ...dependencies, ...devDependencies };
    if (!Object.keys(allDependnecies)) {
        // console.log('this package has no dependencies');
        return;
    }

    // console.log('-> ', packageName);

    Object.entries(allDependnecies).forEach(([dependency, version]) => {
        // is not a dependency released from monorepo. we don't care
        if (!dependency.startsWith('@trezor')) {
            return;
        }

        const [_prefix, name] = dependency.split('/');
        const PACKAGE_PATH = path.join(ROOT, 'packages', name);

        // console.log('checking dependency: ', dependency);

        // check local package
        const packResultRaw = child_process.spawnSync('npm', ['pack', '--dry-run', '--json'], {
            encoding: 'utf-8',
            cwd: PACKAGE_PATH,
        }).stdout;

        const packResultJSON = JSON.parse(packResultRaw);

        const localChecksum = packResultJSON[0].shasum;

        // console.log('local checksum:  ', localChecksum);

        // check remote package
        const viewResultRaw = child_process.spawnSync('npm', ['view', '--json'], {
            encoding: 'utf-8',
            cwd: PACKAGE_PATH,
        }).stdout;

        // means that this package is new and has never been released
        if (!viewResultRaw) {
            updateNeeded.push(dependency);
        } else {
            const viewResultJSON = JSON.parse(viewResultRaw);

            if (viewResultJSON.error) {
                console.log(viewResultJSON);
                return;
            }

            const remoteChecksum = viewResultJSON[dependency].dist.shasum;

            // console.log('remote checksum: ', remoteChecksum);

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
        }

        // console.log('---> recurring into nested package: ', name);

        checkPackageDependencies(name);
    });
};


checkPackageDependencies(packageName);

const formattedDeps = updateNeeded.map(dep => {
    return `- [ ] ${dep}\n`
}).join('');

process.stdout.write(formattedDeps);


// if (updateNeeded.length) {
//     console.log('='.repeat(20));
//     console.log('there are npm dependencies that *MIGHT* need to be released first: ');
//     console.log(updateNeeded.join('\n'));

//     updateNeeded.forEach(package => {
//         console.log(`changelog draft: ${package}`);
//         const changelog = child_process.spawnSync(
//             'bash',
//             ['./ci/scripts/create_changelog_draft.sh', package.split('/').pop()],
//             {
//                 encoding: 'utf-8',
//                 cwd: rootPath,
//             },
//         ).stdout;
//         console.log(changelog);
//     });

//     process.exit(1);
// }

// console.log('All dependencies are up to date. You may now proceed with @trezor/connect release');
