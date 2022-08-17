const child_process = require('child_process');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');

const args = process.argv.slice(2);

// eslint-disable-next-line no-console
console.log('args', args);

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

const cmd = [
    'bump',
    semver,

    // files with version
    './packages/connect/package.json',
    './packages/connect/README.md',
    './packages/connect/src/data/version.ts',
    './packages/connect-web/package.json',
    './packages/connect-web/src/webextension/trezor-usb-permissions.js',
    './packages/connect-popup/package.json',
    './packages/suite-desktop/package.json',
    './packages/suite/package.json',
    './packages/connect-iframe/package.json',
    './packages/connect-explorer/package.json',

    './suite-common/connect-init/package.json',
    './suite-common/wallet-utils/package.json',
    './suite-common/wallet-types/package.json',
    './suite-common/test-utils/package.json',
    './suite-common/suite-types/package.json',
    './suite-native/app/package.json',

    // todo: add examples package.jsons
];

const res = child_process.spawnSync('yarn', cmd, {
    encoding: 'utf-8',
    cwd: REPO_ROOT,
});

if (res.stderr) {
    // eslint-disable-next-line no-console
    console.log(res.stderr);
    process.exit(1);
} else {
    // eslint-disable-next-line no-console
    console.log(res.stdout);
}
