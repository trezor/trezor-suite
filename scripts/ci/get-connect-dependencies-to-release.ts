// This script should check what packages from the repository have a higher version than in NPM
// and stdout out those to be used by GitHub workflow.

import path from 'node:path';
import semver from 'semver';

import type { WorkspacePackage } from '@trezor/requirements';

import { CONNECT_PUBLISH_ROOTS } from './connect-publish-roots';
import { getNpmRemoteGreatestVersion } from './helpers';
import { collectPublishClosure } from './publish-closure';

const ROOT = path.join(import.meta.dirname, '..', '..');

const isPackageBumped = async ({ name, packageJson }: WorkspacePackage): Promise<boolean> => {
    if (packageJson.version === undefined) {
        throw new Error(`${name} is in the connect publish closure but has no version.`);
    }

    const remoteGreatestVersion = await getNpmRemoteGreatestVersion(name);

    // A missing remote version means the package was never published, so it needs releasing.
    return !remoteGreatestVersion || semver.gt(packageJson.version, remoteGreatestVersion);
};

const getConnectDependenciesToRelease = async () => {
    const candidates = collectPublishClosure(ROOT, CONNECT_PUBLISH_ROOTS).filter(
        pkg => !CONNECT_PUBLISH_ROOTS.includes(pkg.name),
    );

    const dependenciesToRelease: string[] = [];
    for (const pkg of candidates) {
        if (await isPackageBumped(pkg)) {
            // The release workflow takes package names without the `@trezor/` scope.
            dependenciesToRelease.push(pkg.name.replace('@trezor/', ''));
        }
    }

    process.stdout.write(JSON.stringify(dependenciesToRelease));
};

getConnectDependenciesToRelease();
