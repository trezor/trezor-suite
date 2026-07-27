import semver from 'semver';

const version = process.argv[2];

const parsedVersion = semver.valid(version);
if (!parsedVersion) {
    throw new Error(`Invalid version: ${version}`);
}

const prerelease = semver.prerelease(parsedVersion);

let deploymentType: 'stable' | 'canary' | 'alpha';
if (prerelease?.[0] === 'alpha') {
    deploymentType = 'alpha';
} else if (prerelease) {
    deploymentType = 'canary';
} else {
    deploymentType = 'stable';
}

process.stdout.write(deploymentType);
