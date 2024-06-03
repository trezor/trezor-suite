import fs from 'fs';
import path from 'path';
import semver from 'semver';

const ROOT = path.join(__dirname, '..', '..');

const getLocalVersion = (packageName: string): string => {
    const packageJsonPath = path.join(ROOT, 'packages', packageName, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found for package: ${packageName}`);
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
};

const checkVersions = (packages: string[], deploymentType: string): void => {
    const versions = packages.map(pkg => getLocalVersion(pkg));

    const isCorrectType = versions.every(version => {
        const isBeta = semver.prerelease(version);
        return (deploymentType === 'canary' && isBeta) || (deploymentType === 'stable' && !isBeta);
    });

    if (!isCorrectType) {
        console.error(
            `Mixed deployment types detected. All versions should be either ${deploymentType}.`,
        );
        process.exit(1);
    } else {
        console.log(`All versions are of the ${deploymentType} deployment type.`);
    }
};

const packages = JSON.parse(process.argv[2]);
const deploymentType = process.argv[3];

checkVersions(packages, deploymentType);
