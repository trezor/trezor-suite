import fetch from 'cross-fetch';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { comment, commit } from './helpers';

const { exec } = require('./helpers');

const AUTHENTICITY_BASE_URL = 'https://data.trezor.io';
const authenticityPaths = {
    T2B1: {
        authenticity: 'firmware/t2b1/authenticity.json',
        authenticityDev: 'firmware/t2b1/authenticity-dev.json',
    },
    T3B1: {
        authenticity: 'firmware/t3b1/authenticity.json',
        authenticityDev: 'firmware/t3b1/authenticity-dev.json',
    },
    T3T1: {
        authenticity: 'firmware/t3t1/authenticity.json',
        authenticityDev: 'firmware/t3t1/authenticity-dev.json',
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

            // Before creating the new PR with new keys we check if there was already previous one.
            // We can delete the previous one since latest one will contain all new changes.
            // If you need to update search query you can test in GH: https://github.com/search and
            // use the documentation https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests
            const prList = await exec('gh', [
                'search',
                'prs',
                '--repo=trezor/trezor-suite',
                '--head=chore/update-device-authenticity-config',
                '--state=open',
            ]);

            console.log('prList', prList);

            if (prList.stdout !== '') {
                const prNumbers = prList.stdout.match(/(?<=\t)(\d+)(?=\t)/g);

                console.log(`Found open pull requests ${prNumbers}. Closing...`);
                for (const prNumber of prNumbers) {
                    try {
                        console.log(`Commenting on PR ${prNumber}`);
                        comment({
                            prNumber,
                            body: `Closing this PR since we are going to create new one with latest changes in ${AUTHENTICITY_BASE_URL}`,
                        });

                        console.log(`Closing PR ${prNumber}`);
                        await exec('gh', [
                            'pr',
                            'close',
                            prNumber,
                            '--repo',
                            'trezor/trezor-suite',
                        ]);
                        console.log(`Closed PR #${prNumber}`);
                    } catch (error) {
                        console.error(`Failed to close PR #${prNumber}:`, error.message);
                    }
                }
            } else {
                console.log(`No open pull requests found.`);
            }

            // Use the content to generate the hash in the branch so it is the same with same content.
            // If we would use the hash provided by Git it would be different because it contains date as well.
            const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
            const hash = crypto.createHash('sha256').update(fileContent).digest('hex');

            // Use the hash to create branch name to avoid using a branch that already exists.
            const branchName = `chore/update-device-authenticity-config-${hash}`;
            const commitMessage = 'chore(connect): update device authenticity config';
            await exec('git', ['checkout', '-b', branchName]);
            commit({
                path: ROOT,
                message: commitMessage,
            });
            // If the branch was already created this will fail, and this is desired feature because we
            // do not want to create 2 branches and PRs with same content.
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
