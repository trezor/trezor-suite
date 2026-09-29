// This script should check what packages from the repository have a higher version than in NPM
// and stdout out those to be used by GitHub workflow.

import { createRequire } from 'node:module';
import path from 'node:path';
import semver from 'semver';

// `@trezor/requirements` is CJS: Node cannot detect its named exports from ESM,
// hence `createRequire` plus the type-only import below.
import type * as Requirements from '@trezor/requirements';

import { CONNECT_PUBLISH_ROOTS } from './connect-publish-roots';
import { getNpmRemoteGreatestVersion } from './helpers';

const {
    computePublishClosure,
    createReadWorkspaceDeps,
    getWorkspaceDirectoryMap,
    readPackageJson,
} = createRequire(import.meta.url)('@trezor/requirements') as typeof Requirements;

const ROOT = path.join(import.meta.dirname, '..', '..');
const readWorkspaceDeps = createReadWorkspaceDeps(ROOT);
const workspaceDirs = getWorkspaceDirectoryMap(ROOT);

const isPackageBumped = async (packageName: string): Promise<boolean> => {
    const dir = workspaceDirs.get(`@trezor/${packageName}`);
    if (dir === undefined) {
        throw new Error(`Closure references @trezor/${packageName} but no such workspace exists.`);
    }

    const { version: localVersion } = readPackageJson<{ version: string }>(dir);
    const remoteGreatestVersion = await getNpmRemoteGreatestVersion(`@trezor/${packageName}`);

    // A missing remote version means the package was never published, so it needs releasing.
    return !remoteGreatestVersion || semver.gt(localVersion, remoteGreatestVersion as string);
};

const getConnectDependenciesToRelease = async () => {
    const closure = computePublishClosure(CONNECT_PUBLISH_ROOTS, readWorkspaceDeps);

    const candidates = [...closure].filter(pkg => !CONNECT_PUBLISH_ROOTS.includes(pkg));

    const dependenciesToRelease: string[] = [];
    for (const pkg of candidates) {
        if (await isPackageBumped(pkg)) {
            dependenciesToRelease.push(pkg);
        }
    }

    process.stdout.write(JSON.stringify(dependenciesToRelease));
};

getConnectDependenciesToRelease();
