// This script should check what packages from the repository have a higher version than in NPM
// and stdout out those to be used by GitHub workflow.

import fs from 'fs';
import util from 'util';
import path from 'path';
import semver from 'semver';

import { getNpmRemoteGreatestVersion } from './helpers';

const readFile = util.promisify(fs.readFile);

const ROOT = path.join(__dirname, '..', '..');

const nonReleaseDependencies: string[] = [];

const checkNonReleasedDependencies = async (packageName: string) => {
    const rawPackageJSON = await readFile(
        path.join(ROOT, 'packages', packageName, 'package.json'),
        'utf-8',
    );

    const packageJSON = JSON.parse(rawPackageJSON);
    const {
        version: localVersion,
        dependencies,
        // devDependencies // We should ignore devDependencies.
    } = packageJSON;

    const remoteGreatestVersion = await getNpmRemoteGreatestVersion(`@trezor/${packageName}`);

    // If local version is greatest than the greatest one in NPM we add it to the release.
    if (semver.gt(localVersion, remoteGreatestVersion as string)) {
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

        await checkNonReleasedDependencies(name);
    }
};

const getConnectDependenciesToRelease = async () => {
    // We check what dependencies need to be released because they have version bumped locally
    // and remote greatest version is lower than the local one.
    await checkNonReleasedDependencies('connect');
    await checkNonReleasedDependencies('connect-web');
    await checkNonReleasedDependencies('connect-webextension');

    // We do not want to include `connect`, `connect-web` and `connect-webextension` since we want
    // to release those separately and we always want to release them.
    const onlyDependenciesToRelease = nonReleaseDependencies.filter(item => {
        return !['connect', 'connect-web', 'connect-webextension'].includes(item);
    });

    // We use `onlyDependenciesToRelease` to trigger NPM releases
    const dependenciesToRelease = JSON.stringify(onlyDependenciesToRelease);

    process.stdout.write(dependenciesToRelease);
};

getConnectDependenciesToRelease();
