const semver = require('semver');

const version = process.argv[2];

let deploymentType;
if (semver.prerelease(version)) {
    deploymentType = 'canary';
} else {
    deploymentType = 'stable';
}

process.stdout.write(deploymentType);
