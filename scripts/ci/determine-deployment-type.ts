import semver from 'semver';

const version = process.argv[2];

if (!version) {
    throw new Error('Missing required argument: version');
}

let deploymentType;
if (semver.prerelease(version)) {
    deploymentType = 'canary';
} else if (semver.minor(version) || semver.major(version)) {
    deploymentType = 'stable';
} else {
    throw new Error(`Invalid version: ${version}`);
}

process.stdout.write(deploymentType);
