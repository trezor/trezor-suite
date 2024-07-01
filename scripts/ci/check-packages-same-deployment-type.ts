import semver from 'semver';

import { getLocalVersion } from './helpers';

const checkVersions = (packages: string[], deploymentType: string): void => {
    const versions = packages.map(packageName => getLocalVersion(packageName));

    const isCorrectType = versions.every(version => {
        const isBeta = semver.prerelease(version);
        return (deploymentType === 'canary' && isBeta) || (deploymentType === 'stable' && !isBeta);
    });

    if (!isCorrectType) {
        console.error(
            `Mixed deployment types detected. All versions should be either "stable" or "canary".`,
        );
        process.exit(1);
    } else {
        console.log(`All versions are of the ${deploymentType} deployment type.`);
    }
};

const packages = JSON.parse(process.argv[2]);
const deploymentType = process.argv[3];

checkVersions(packages, deploymentType);
