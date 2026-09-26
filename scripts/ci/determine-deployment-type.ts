import semver from 'semver';

import { getReleaseType } from './get-release-type';

const version = process.argv[2];

const parsedVersion = semver.valid(version);
if (!parsedVersion) {
    throw new Error(`Invalid version: ${version}`);
}

process.stdout.write(getReleaseType(parsedVersion));
