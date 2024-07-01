const semver = require('semver');

const version = process.argv[2];

let deploymentType;
if (semver.prerelease(version)) {
    deploymentType = 'canary';
} else if (semver.minor(version) || semver.major(version)) {
    deploymentType = 'stable';
} else {
    throw new Error(`Invalid version: ${version}`);
}

process.stdout.write(deploymentType);
