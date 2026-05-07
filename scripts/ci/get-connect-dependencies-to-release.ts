// This script should check what packages from the repository have a higher version than in NPM
// and stdout out those to be used by GitHub workflow.

import fs from 'node:fs';
import util from 'node:util';
import path from 'node:path';
import semver from 'semver';

import { computePublishClosure, createReadWorkspaceDeps } from '@trezor/requirements';

import { getNpmRemoteGreatestVersion } from './helpers';

const readFile = util.promisify(fs.readFile);

const ROOT = path.join(import.meta.dirname, '..', '..');
const readWorkspaceDeps = createReadWorkspaceDeps(ROOT);

const ROOT_PACKAGES = [
    'connect',
    'connect-web',
    'connect-mobile',
    'connect-webextension',
    'connect-plugin-stellar',
    'connect-plugin-ethereum',
];

// We do not want to include `connect`, `connect-web`, `connect-webextension` and
// `connect-mobile` since we want to release those separately and we always want
// to release them.
const ALWAYS_RELEASED_SEPARATELY = [
    'connect',
    'connect-web',
    'connect-webextension',
    'connect-mobile',
];

const isPackageBumped = async (packageName: string): Promise<boolean> => {
    const rawPackageJSON = await readFile(
        path.join(ROOT, 'packages', packageName, 'package.json'),
        'utf-8',
    );
    const { version: localVersion } = JSON.parse(rawPackageJSON);
    const remoteGreatestVersion = await getNpmRemoteGreatestVersion(`@trezor/${packageName}`);

    // A missing remote version means the package was never published, so it needs releasing.
    return !remoteGreatestVersion || semver.gt(localVersion, remoteGreatestVersion as string);
};

const getConnectDependenciesToRelease = async () => {
    const closure = computePublishClosure(ROOT_PACKAGES, readWorkspaceDeps);

    const candidates = [...closure].filter(pkg => !ALWAYS_RELEASED_SEPARATELY.includes(pkg));

    const dependenciesToRelease: string[] = [];
    for (const pkg of candidates) {
        if (await isPackageBumped(pkg)) {
            dependenciesToRelease.push(pkg);
        }
    }

    process.stdout.write(JSON.stringify(dependenciesToRelease));
};

getConnectDependenciesToRelease();
