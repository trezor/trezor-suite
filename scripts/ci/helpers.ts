import fetch from 'cross-fetch';
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';

import { getTrezorPackageDir } from './trezor-package-path.js';

export { getTrezorPackageDir, getTrezorPackageRelativePath } from './trezor-package-path.js';

const ROOT = path.join(import.meta.dirname, '..', '..');

const updateNeeded: string[] = [];

export const gettingNpmDistributionTags = async (
    packageName: string,
): Promise<Record<string, string> | undefined> => {
    const npmRegistryUrl = `https://registry.npmjs.org/${packageName}`;
    const response = await fetch(npmRegistryUrl);
    const data = await response.json();
    // Package does not exist on NPM yet (e.g. a newly added or renamed package).
    if (data.error) {
        return undefined;
    }

    return data['dist-tags'];
};

export const getNpmRemoteGreatestVersion = async (moduleName: string) => {
    const distributionTags = await gettingNpmDistributionTags(moduleName);

    const versionArray = distributionTags ? Object.values(distributionTags) : [];
    // No published versions/dist-tags (new, renamed or unpublished package) means there is
    // nothing to compare against, so there is no remote greatest version.
    if (versionArray.length === 0) {
        return undefined;
    }

    return versionArray.reduce((max, current) => (semver.gt(current, max) ? current : max));
};

export const getTrezorDependencies = async (packageNameWithoutTrezorPrefix: string) => {
    const packageJsonPath = path.join(
        getTrezorPackageDir(packageNameWithoutTrezorPrefix),
        'package.json',
    );
    const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    // We should ignore devDependencies.
    const dependencies = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];

    return dependencies
        .filter(dep => dep.startsWith('@trezor/'))
        .map(dep => dep.replace('@trezor/', ''));
};

/**
 * This functions recursively checks the @trezor dependencies of a given package
 * @param packageNameWithoutTrezorPrefix (string) - package name without the @trezor/ prefix
 * @returns
 */
export const getPackageDependencies = async (
    packageNameWithoutTrezorPrefix: string,
): Promise<{ update: string[] }> => {
    console.info('-------------------------------------------------------------------------');
    console.info(`Getting @trezor dependencies of package ${packageNameWithoutTrezorPrefix}`);

    const trezorDependencies = await getTrezorDependencies(packageNameWithoutTrezorPrefix);
    console.info(`Trezor dependencies: ${trezorDependencies.join(', ')}`);

    for await (const trezorDependencyNameWithoutPrefix of trezorDependencies) {
        // trezorDependencyNameWithoutPrefix is like 'connect', 'suite', etc.

        // if the checked dependency is already in the array, remove it and push it to the end of array
        // this way, the final array should be sorted in order in which that dependencies listed there
        // should be released from the last to the first.
        const index = updateNeeded.indexOf(trezorDependencyNameWithoutPrefix);
        if (index > -1) {
            updateNeeded.splice(index, 1);
        }
        updateNeeded.push(trezorDependencyNameWithoutPrefix);

        await getPackageDependencies(trezorDependencyNameWithoutPrefix);
    }

    return {
        update: updateNeeded,
    };
};

export const exec = (cmd: string, params: any[]): Promise<{ stdout: string; stderr: string }> => {
    console.info(cmd, ...params);

    const res: ChildProcessWithoutNullStreams = spawn(cmd, params, {
        cwd: ROOT,
    });

    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        res.stdout.on('data', data => {
            stdout += data;
        });

        res.stderr.on('data', data => {
            stderr += data;
        });

        res.on('close', status => {
            if (status !== 0) {
                console.error('Error executing command:', cmd, ...params);
                console.error('Command output:', stdout);
                console.error('Command error output:', stderr);
                reject(
                    new Error(
                        `Command "${cmd} ${params.join(' ')}" failed with exit code ${status}: ${stderr}`,
                    ),
                );
            } else {
                resolve({ stdout, stderr });
            }
        });

        res.on('error', err => {
            console.error('Failed to start process:', err);
            reject(err);
        });
    });
};

export const commit = async ({ path, message }: { path: string; message: string }) => {
    await exec('git', ['add', path]);
    // We need to add `-n` so we do not have problems with git hooks when committing in CI.
    await exec('git', ['commit', '-m', `${message}`, '-n']);
};

export const comment = async ({ prNumber, body }: { prNumber: string; body: string }) => {
    await exec('gh', ['pr', 'comment', `${prNumber}`, '--body', body]);
};

export const getLocalVersion = (packageName: string) => {
    const packageJsonPath = path.join(getTrezorPackageDir(packageName), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found for package: ${packageName}`);
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    return packageJson.version;
};
