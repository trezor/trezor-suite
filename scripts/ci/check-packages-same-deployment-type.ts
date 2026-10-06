import { getReleaseType } from './get-release-type';
import { getLocalVersion } from './helpers';

const checkVersions = (packages: string[], deploymentType: string): void => {
    const versions = packages.map(packageName => getLocalVersion(packageName));

    const isCorrectType = versions.every(version => deploymentType === getReleaseType(version));

    if (!isCorrectType) {
        console.error(
            `Mixed deployment types detected. All versions should be "stable", "alpha", or "canary".`,
        );
        process.exit(1);
    } else {
        console.log(`All versions are of the ${deploymentType} deployment type.`);
    }
};

const packagesArg = process.argv[2];
const deploymentType = process.argv[3];

if (!packagesArg || !deploymentType) {
    console.error('Usage: check-packages-same-deployment-type <packages-json> <deployment-type>');
    process.exit(1);
}

checkVersions(JSON.parse(packagesArg), deploymentType);
