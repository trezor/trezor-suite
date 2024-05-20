// This script should check what packages are from the repository have different most recent version in NPM
// as the on e in the package.json and trigger the workflow to release to NPM those packages.

import { exec } from './helpers';
import fs from 'fs';
import util from 'util';
import path from 'path';
import fetch from 'cross-fetch';
import semver from 'semver';

const args = process.argv.slice(2);

if (args.length < 2) {
    throw new Error('Check npm dependencies requires 2 parameters: deploymentType branchName');
}
const [deploymentType, branchName] = args;

const allowedDeploymentType = ['canary', 'stable'];
if (!allowedDeploymentType.includes(deploymentType)) {
    throw new Error(
        `provided semver: ${deploymentType} must be one of ${allowedDeploymentType.join(', ')}`,
    );
}

const readFile = util.promisify(fs.readFile);

const ROOT = path.join(__dirname, '..', '..');

const triggerReleaseNpmWorkflow = (branch, packages, type) =>
    exec('gh', [
        'workflow',
        'run',
        '.github/workflows/release-connect-npm.yml',
        '--ref',
        branch,
        '--field',
        `packages=${packages}`,
        '--field',
        `deploymentType=${type}`,
    ]);

const getNpmRemoteGreatestVersion = async (moduleName: string) => {
    const [_prefix] = moduleName.split('/');
    const npmRegistryUrl = `https://registry.npmjs.org/${moduleName}`;

    try {
        console.log(`fetching npm registry info from: ${npmRegistryUrl}`);
        const response = await fetch(npmRegistryUrl);
        const data = await response.json();
        if (data.error) {
            return { success: false };
        }

        const distributionTags = data['dist-tags'];
        const versionArray: string[] = Object.values(distributionTags);
        const greatestVersion = versionArray.reduce((max, current) => {
            return semver.gt(current, max) ? current : max;
        });

        return greatestVersion;
    } catch (error) {
        console.error('error:', error);
        throw new Error('Not possible to get remote greatest version');
    }
};

const nonReleaseDependencies: string[] = [];

const checkNonReleasedDependencies = async (packageName: string) => {
    const rawPackageJSON = await readFile(
        path.join(ROOT, 'packages', packageName, 'package.json'),
        'utf-8',
    );

    const packageJSON = JSON.parse(rawPackageJSON);
    const {
        version,
        dependencies,
        // devDependencies // We should ignore devDependencies.
    } = packageJSON;

    const remoteGreatestVersion = await getNpmRemoteGreatestVersion(`@trezor/${packageName}`);

    // If local version is greatest than the greatest one in NPM we add it to the release.
    if (semver.gt(version, remoteGreatestVersion as string)) {
        const index = nonReleaseDependencies.indexOf(packageName);
        if (index > -1) {
            nonReleaseDependencies.splice(index, 1);
        }
        nonReleaseDependencies.push(packageName);
    }

    if (!dependencies || !Object.keys(dependencies)) {
        return;
    }

    // eslint-disable-next-line no-restricted-syntax
    for await (const [dependency] of Object.entries(dependencies)) {
        // is not a dependency released from monorepo. we don't care
        if (!dependency.startsWith('@trezor')) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const [_prefix, name] = dependency.split('/');

        console.log('name', name);

        await checkNonReleasedDependencies(name);
    }
    console.log('nonReleaseDependencies', nonReleaseDependencies);
};

const initConnectNpmRelease = async () => {
    // We check what dependencies need to be released because they have version bumped locally
    // and remote greatest version is lower than the local one.
    await checkNonReleasedDependencies('connect');
    await checkNonReleasedDependencies('connect-web');
    await checkNonReleasedDependencies('connect-webextension');
    console.log('Final nonReleaseDependencies', nonReleaseDependencies);

    // We do not want to include `connect`, `connect-web` and `connect-webextension` since we want
    // to release those separately and we always want to release them.
    const onlyDependenciesToRelease = nonReleaseDependencies.filter(item => {
        return !['connect', 'connect-web', 'connect-webextension'].includes(item);
    });

    // We use `onlyDependenciesToRelease` to trigger NPM releases
    const dependenciesToRelease = JSON.stringify(onlyDependenciesToRelease);
    console.log('dependenciesToRelease:', dependenciesToRelease);
    console.log('deploymentType:', deploymentType);
    console.log('branchName:', branchName);

    // Now we want to trigger the action that will trigger the actual release,
    // after approval form authorized member.
    const releaseDependencyActionOutput = triggerReleaseNpmWorkflow(
        branchName,
        dependenciesToRelease,
        deploymentType,
    );

    console.log('releaseDependencyActionOutput output:', releaseDependencyActionOutput.stdout);
};

initConnectNpmRelease();
