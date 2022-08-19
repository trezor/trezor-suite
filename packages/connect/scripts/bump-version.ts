/* eslint-disable no-console */

import child_process from 'child_process';
import path from 'path';
import fs from 'fs';

const REPO_ROOT = path.join(__dirname, '..', '..', '..');

const args = process.argv.slice(2);

const prePackageJSON = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'packages/connect/package.json'), 'utf-8'),
);

if (args.length !== 1) {
    throw new Error('semver arg is missing');
}

const [semver] = args;

const allowedSemver = ['prerelease', 'patch', 'minor', 'major'];

if (!allowedSemver.includes(semver)) {
    throw new Error(
        `semver arg "${semver} is invalid. Must be one of [${allowedSemver.join(', ')}]`,
    );
}

// files with version
const connectPaths = [
    './packages/connect/package.json',
    './packages/connect/README.md',
    './packages/connect/src/data/version.ts',
    './packages/connect-web/package.json',
    './packages/connect-web/src/webextension/trezor-usb-permissions.js',
];

const cmd = ['bump', semver];

const res = child_process.spawnSync('yarn', [...cmd, ...connectPaths], {
    encoding: 'utf-8',
    cwd: REPO_ROOT,
});

if (res.stderr) {
    console.log(res);
    process.exit(1);
} else {
    console.log(res.stdout);
}

const afterPackageJSON = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'packages/connect/package.json'), 'utf-8'),
);

const dependenciesToBeBumped = ['@trezor/connect', '@trezor/connect-web'];

dependenciesToBeBumped.forEach(dependency => {
    const res = child_process.spawnSync(
        'sh',
        [
            '-c',
            `grep -rl '"${dependency}": "${prePackageJSON.version}"' . | xargs sed -i 's|"${dependency}": "${prePackageJSON.version}"|"${dependency}": "${afterPackageJSON.version}"|g'`,
        ],
        {
            encoding: 'utf-8',
            cwd: REPO_ROOT,
        },
    );
    console.log('res', res);
    if (res.stderr) {
        console.log(res);
        process.exit(1);
    } else {
        console.log('dependencies updated ');
    }
});
