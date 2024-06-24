import fs from 'fs';
import path from 'path';
import semver from 'semver';
import fetch from 'cross-fetch';

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

import { promisify } from 'util';

const readFile = promisify(fs.readFile);

const { getLocalAndRemoteChecksums } = require('./check-npm-and-local');

const ROOT = path.join(__dirname, '..', '..');

const updateNeeded: string[] = [];
const errors: string[] = [];

export const gettingNpmDistributionTags = async (packageName: string) => {
    const npmRegistryUrl = `https://registry.npmjs.org/${packageName}`;
    const response = await fetch(npmRegistryUrl);
    const data = await response.json();
    if (data.error) {
        return { success: false };
    }

    return data['dist-tags'];
};

export const getNpmRemoteGreatestVersion = async (moduleName: string) => {
    try {
        const distributionTags = await gettingNpmDistributionTags(moduleName);

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

export const checkPackageDependencies = async (
    packageName: string,
    deploymentType: 'stable' | 'canary',
): Promise<{ update: string[]; errors: string[] }> => {
    console.log('######################################################');
    console.log(`Checking package ${packageName}`);
    const rawPackageJSON = await readFile(
        path.join(ROOT, 'packages', packageName, 'package.json'),
        'utf-8',
    );

    const packageJSON = JSON.parse(rawPackageJSON);
    const {
        dependencies,
        // devDependencies // We should ignore devDependencies.
    } = packageJSON;

    if (!dependencies || !Object.keys(dependencies)) {
        return { errors, update: updateNeeded };
    }

    // eslint-disable-next-line no-restricted-syntax
    for await (const [dependency, _version] of Object.entries(dependencies)) {
        // is not a dependency released from monorepo. we don't care
        if (!dependency.startsWith('@trezor')) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const [_prefix, name] = dependency.split('/');
        const response = await getLocalAndRemoteChecksums(dependency);
        if (!response.success) {
            // If the package was not found it might be it has not been release yet or other issue, so we include it in errors.
            const index = errors.findIndex(lib => lib === dependency);
            console.log('index', index);
            if (index > -1) {
                errors.splice(index, 1);
            }

            errors.push(dependency);
        } else {
            const { localChecksum, remoteChecksum, distributionTags } = response.data;
            console.log('distributionTags', distributionTags);

            if (localChecksum !== remoteChecksum) {
                // if the checked dependency is already in the array, remove it and push it to the end of array
                // this way, the final array should be sorted in order in which that dependencies listed there
                // should be released from the last to the first.
                const index = updateNeeded.indexOf(dependency);
                if (index > -1) {
                    updateNeeded.splice(index, 1);
                }
                updateNeeded.push(dependency);
            } else if (
                deploymentType === 'stable' &&
                distributionTags.beta &&
                distributionTags.latest &&
                semver.gt(distributionTags.beta, distributionTags.latest)
            ) {
                // If this is an stable release and last release was beta,
                // meaning the beta version number is greatest than the latest one, then we include it to be released.
                const index = updateNeeded.indexOf(dependency);
                if (index > -1) {
                    updateNeeded.splice(index, 1);
                }
                updateNeeded.push(dependency);
            }

            await checkPackageDependencies(name, deploymentType);
        }
    }

    return {
        update: updateNeeded,
        errors,
    };
};

export const exec = async (
    cmd: string,
    params: any[],
): Promise<{ stdout: string; stderr: string }> => {
    console.log(cmd, ...params);

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
    await exec('git', ['commit', '-m', `${message}`]);
};

export const comment = async ({ prNumber, body }: { prNumber: string; body: string }) => {
    await exec('gh', ['pr', 'comment', `${prNumber}`, '--body', body]);
};

export const getLocalVersion = (packageName: string) => {
    const packageJsonPath = path.join(ROOT, 'packages', packageName, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found for package: ${packageName}`);
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
};
