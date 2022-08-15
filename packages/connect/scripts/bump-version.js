const child_process = require('child_process');
const path = require('path');

const PACKAGE_PATH = path.join(__dirname, '..');

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
    './package.json',
    'README.md',
    './src/data/version.ts',
    '../connect-web/package.json',
    '../connect-web/src/webextension/trezor-usb-permissions.js',
    '../connect-popup/package.json',
    '../connect-iframe/package.json',
    '../connect-explorer/package.json',
    '../suite-common/connect-init/package.json',
    '../suite-common/wallet-utils/package.json',
    '../suite-common/wallet-types/package.json',
    '../suite-common/test-utils/package.json',
    '../suite-common/suite-types/package.json',
    '../suite-common/suite-desktop/package.json',
    '../suite-common/suite/package.json',
    '../suite-native/app/package.json',

    // todo: add examples package.jsons
];

const res = child_process.spawnSync('yarn', cmd, {
    encoding: 'utf-8',
    cwd: PACKAGE_PATH,
}).stdout;
