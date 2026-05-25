/* eslint-disable no-console */

import child_process from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const args = process.argv.slice(2);

if (args.length !== 1) {
    throw new Error('semver arg is missing');
}

const semver = args[0] ?? '';

const allowedSemvers = ['patch', 'prepatch', 'minor', 'preminor', 'prerelease'];
if (!allowedSemvers.includes(semver)) {
    throw new Error(
        `semver arg "${semver} is invalid. Must be one of [${allowedSemvers.join(', ')}]`,
    );
}

// files with version
const connectPaths = [
    './packages/connect/package.json',
    './packages/connect/README.md',
    './packages/connect-common/src/data/version.ts',
    './packages/connect-web/package.json',
    './packages/connect-webextension/package.json',
    './packages/connect-mobile/package.json',
];

const cmd = ['bump', semver];

const res = child_process.spawnSync('yarn', [...cmd, ...connectPaths], {
    encoding: 'utf-8',
    cwd: REPO_ROOT,
});
if (res.status !== 0) {
    console.log(res);
    process.exit(1);
} else {
    console.log(res.stdout);
}
