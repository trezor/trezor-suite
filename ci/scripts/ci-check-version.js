const semver = require('semver');
const packageJSON = require('../package.json');

const args = process.argv.slice(2);

if (args.length < 2)
    throw new Error(
        'Version check script requires 2 parameters: current npm version and branch name',
    );

const [npmVersion, branch] = args;
const PRODUCTION = ['npm-release'];

const { version } = packageJSON;

if (!semver.valid(version)) throw new Error(`${version} is not a valid version`);

if (PRODUCTION.find(b => branch.startsWith(b))) {
    if (semver.prerelease(version)) throw new Error(`${version} is a prerelease version`);
} else {
    const pre = semver.prerelease(version);
    if (!pre) throw new Error(`${version} is not a prerelease version`);
    if (pre[0] !== 'beta')
        throw new Error(`${version} prerelease version should contain "-beta" suffix`);
}

if (!semver.gt(version, npmVersion))
    throw new Error(`${version} is the same or lower than the npm registry version ${npmVersion}`);
