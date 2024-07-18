import fetch from 'cross-fetch';
import fs from 'fs-extra';
import path from 'path';
import { commit } from './helpers';

const { exec } = require('./helpers');

const AUTHENTICITY_BASE_URL = 'https://data.trezor.io';
const authenticityPaths = {
    T2B1: {
        authenticity: 'firmware/t2b1/authenticity.json',
        authenticityDev: 'firmware/t2b1/authenticity-dev.json',
    },
    T3T1: {
        authenticity: 'firmware/t3t1/authenticity.json',
        authenticityDev: 'firmware/t3t1/authenticity-dev.json',
    },
    T3B1: {
        authenticity: 'firmware/t3b1/authenticity.json',
        authenticityDev: 'firmware/t3b1/authenticity-dev.json',
    },
};

const ROOT = path.join(__dirname, '..', '..');
const CONFIG_FILE_PATH = path.join(ROOT, 'packages/connect/src/data/deviceAuthenticityConfig.ts');

type AuthenticityPathsKeys = keyof typeof authenticityPaths;

const fetchJSON = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.json();
};

const updateConfigFromJSON = async () => {
    try {
        const devicesKeys = Object.keys(authenticityPaths) as AuthenticityPathsKeys[];

        // Import the current configuration object
        let { deviceAuthenticityConfig } = require(CONFIG_FILE_PATH);

        for (const deviceKey of devicesKeys) {
            const { authenticity, authenticityDev } = authenticityPaths[deviceKey];
            const authenticityUrl = `${AUTHENTICITY_BASE_URL}/${authenticity}`;
            const authenticityData = await fetchJSON(authenticityUrl);
            const authenticityDevUrl = `${AUTHENTICITY_BASE_URL}/${authenticityDev}`;
            const authenticityDevData = await fetchJSON(authenticityDevUrl);

            deviceAuthenticityConfig[deviceKey] = {
                rootPubKeys: authenticityData.root_pubkeys,
                caPubKeys: authenticityData.ca_pubkeys,
                debug: {
                    rootPubKeys: authenticityDevData.root_pubkeys,
                    caPubKeys: authenticityDevData.ca_pubkeys,
                },
            };
        }

        const updatedConfigString = `
            /** THIS FILE IS AUTOMATICALLY UPDATED by script ci/scripts/check-connect-data.ts  */
            import { DeviceAuthenticityConfig } from './deviceAuthenticityConfigTypes';

            /**
             * How to update this config or check Sentry "Device authenticity invalid!" error? Please read this internal description:
             * https://www.notion.so/satoshilabs/Device-authenticity-check-b8656a0fe3ab4a0d84c61534a73de462?pvs=4
             */
            export const deviceAuthenticityConfig: DeviceAuthenticityConfig = ${JSON.stringify(deviceAuthenticityConfig, null, 4)};
          `;

        await fs.writeFile(CONFIG_FILE_PATH, updatedConfigString);

        await exec('yarn', ['prettier', '--write', CONFIG_FILE_PATH]);

        console.log('Configuration updated successfully.');

        console.log('Checking if there were changes.');
        const changes = await exec('git', ['diff', CONFIG_FILE_PATH]);
        if (changes.stdout !== '') {
            console.log('There were changes in keys.');
            // There were changes in CONFIG_FILE_PATH
            const hashChanges = await exec('git', [
                'log',
                '-1',
                '--pretty=format:"%H"',
                '--',
                CONFIG_FILE_PATH,
            ]);
            // We use the hash of the changes to create branch name to avoid use a branch that already exists.
            const branchName = `chore/update-device-authenticity-config-${hashChanges.stdout.replace(/"/g, '')}`;
            const commitMessage = 'chore(connect): update device authenticity config';
            await exec('git', ['checkout', '-b', branchName]);
            commit({
                path: ROOT,
                message: commitMessage,
            });
            await exec('git', ['push', 'origin', branchName]);

            await exec('gh', [
                'pr',
                'create',
                '--repo',
                'trezor/trezor-suite',
                '--title',
                `${commitMessage}`,
                '--body-file',
                'docs/packages/connect/check-connect-data.md',
                '--base',
                'develop',
                '--head',
                branchName,
            ]);
        }
    } catch (error) {
        console.error(`Error updating configuration: ${error.message}`);
    }
};

updateConfigFromJSON();
