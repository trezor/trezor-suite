/* eslint-disable camelcase */

const semver = require('semver');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length < 3)
    throw new Error(
        'Version check script requires 3 parameters: package name, branch name and dist tag (beta | latest)',
    );

const [packageName, branch, distTag] = args;

if (!['latest', 'beta'].includes(distTag)) {
    throw new Error('distTag (3rd parameter) must be either "beta" or "latest"');
}

const ROOT = path.join(__dirname, '..', '..');
const PACKAGE_PATH = path.join(ROOT, 'packages', packageName);

// read package version
const packageJSONRaw = fs.readFileSync(path.join(PACKAGE_PATH, 'package.json'), {
    encoding: 'utf-8',
});
const packageJSON = JSON.parse(packageJSONRaw);
const { version } = packageJSON;

// check remote package
const npmInfoRaw = child_process.spawnSync('npm', ['view', '--json'], {
    encoding: 'utf-8',
    cwd: PACKAGE_PATH,
}).stdout;

const npmInfo = JSON.parse(npmInfoRaw);
if (npmInfo && npmInfo.error && npmInfo.error.code === 'E404') {
    // exit 0, its ok, we probably did not publish it yet
    process.exit(0);
}

const npmVersion = npmInfo[packageJSON.name]['dist-tags'][distTag];

const PRODUCTION = ['npm-release'];

if (!semver.valid(version)) throw new Error(`${version} is not a valid version`);

if (PRODUCTION.find(b => branch.startsWith(b))) {
    if (semver.prerelease(version)) {
        throw new Error(`${version} is a prerelease version`);
    }
} else {
    const pre = semver.prerelease(version);
    if (!pre) {
        throw new Error(`${version} is not a prerelease version`);
    }
    if (pre[0] !== 'beta') {
        throw new Error(`${version} prerelease version should contain "-beta" suffix`);
    }
}

if (!semver.gt(version, npmVersion)) {
    throw new Error(`${version} is the same or lower than the npm registry version ${npmVersion}`);
}
