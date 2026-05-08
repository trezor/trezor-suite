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

// The connect distribution packages. Used both as BFS roots to compute the
// @trezor/* dep closure, and as the exclude list for the output — these four
// are released by `deploy-npm-connect` (a hardcoded matrix), not by
// `deploy-npm-connect-dependencies` (which consumes this script's output).
//
// Kept in sync with `CONNECT_PUBLISH_ROOTS` in
// `scripts/ci/gen-workflow-paths.ts`. If they diverge, either one or both
// should justify it inline; if they stay identical for long enough, extract
// to a shared module.
const CONNECT_PUBLISH_ROOTS = ['connect', 'connect-web', 'connect-mobile', 'connect-webextension'];

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
