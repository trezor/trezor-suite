/* eslint-disable camelcase */

import semver from 'semver';
import child_process from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

if (args.length < 2)
    throw new Error(
        'Version check script requires 2 parameters: package name and dist tag (alpha | beta | latest)',
    );

const [packageName, distTag] = args;

if (!['latest', 'beta', 'alpha'].includes(distTag)) {
    throw new Error('distTag (3rd parameter) must be "alpha", "beta", or "latest"');
}

const ROOT = path.join(import.meta.dirname, '..', '..');
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

if (!semver.valid(version)) throw new Error(`${version} is not a valid version`);

// When npmVersion is undefined it means that there was no previous release on that distTag so every version is valid.
if (npmVersion && !semver.gt(version, npmVersion)) {
    throw new Error(`${version} is the same or lower than the npm registry version ${npmVersion}`);
}
