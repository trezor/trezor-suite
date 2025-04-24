/* eslint-disable no-console */

import * as fs from 'fs/promises';
import * as path from 'path';

import { FirmwareType } from '@trezor/device-utils';

import { MESSAGE_RELEASE_PATH } from '../src/constants';
import { ConditionalRelease, ReleaseInfo, ReleaseOriginal } from '../src/types';

function createFirmwareInfo(input: ReleaseOriginal): ReleaseInfo {
    return {
        required: input.required ?? false,
        version: input.version,
        min_bootloader_version: input.min_bootloader_version,
        min_firmware_version: input.min_firmware_version,
        bootloader_version: input.bootloader_version,
        translations: input.translations ? input.translations : [],
        firmware_revision: input.firmware_revision,
        fingerprint: input.fingerprint_bitcoinonly
            ? input.fingerprint_bitcoinonly
            : input.fingerprint,
        changelog: input.changelog_bitcoinonly ? input.changelog_bitcoinonly : input.changelog,
    };
}

// This is for now hardcoded but could be changed manually in the generated file.
const minSuiteVersion = '25.2.1';
const rolloutProbability = 100;

// Intermediaries are for now fixed and hard-coded.
const intermediaries = {
    T1B1: [
        {
            min_firmware_version: '1.6.2',
            version: 1,
        },
        {
            min_firmware_version: '1.12.0',
            version: 2,
        },
        {
            min_firmware_version: '1.12.1',
            version: 2,
        },
    ],
};

const generateReleases = async () => {
    const firmwareTypes = ['t1b1', 't2b1', 't2t1', 't3b1', 't3t1'];
    const transformedReleases: ConditionalRelease[] = [];

    const transformedReleasesObject: Record<string, ConditionalRelease[]> = {};

    for (const firmwareType of firmwareTypes) {
        const filePath = path.join(
            __dirname,
            '../../..',
            `packages/connect-common/files/firmware/${firmwareType}/releases.json`,
        );

        try {
            const data = await fs.readFile(filePath, 'utf-8');
            const releases: ReleaseOriginal[] = JSON.parse(data);

            if (releases.length === 0) {
                console.warn(`No releases found for ${firmwareType}`);
                continue;
            }

            const latestRelease = releases[0];
            const releaseUniversal: ConditionalRelease = {
                firmware_type: FirmwareType.Regular,
                conditions: {
                    environment: {
                        min_suite_version: minSuiteVersion,
                    },
                    rollout_probability: rolloutProbability,
                },
                release: createFirmwareInfo(latestRelease),
            };
            const releaseBitcoinOnly: ConditionalRelease = {
                firmware_type: FirmwareType.BitcoinOnly,
                conditions: {
                    environment: {
                        min_suite_version: minSuiteVersion,
                    },
                    rollout_probability: rolloutProbability,
                },
                release: createFirmwareInfo(latestRelease),
            };
            transformedReleases.push(releaseUniversal);
            transformedReleases.push(releaseBitcoinOnly);

            transformedReleasesObject[firmwareType.toLocaleUpperCase()] = [
                releaseUniversal,
                releaseBitcoinOnly,
            ];
        } catch (err) {
            console.error(`Error reading the file for ${firmwareType}:`, err);
        }
    }

    // Read last sequence number from previous release or default to 1.
    let lastSequence = 1;
    try {
        const lastRelease = JSON.parse(await fs.readFile(MESSAGE_RELEASE_PATH, 'utf-8'));
        lastSequence = lastRelease.sequence || 1;
    } catch {
        console.info('No previous release found, starting with sequence 1');
    }

    const releaseMessage = {
        version: 1,
        timestamp: new Date().toISOString(),
        sequence: lastSequence + 1,
        releases: transformedReleasesObject,
        intermediaries,
    };

    const outputFilePath = MESSAGE_RELEASE_PATH;
    try {
        await fs.writeFile(outputFilePath, JSON.stringify(releaseMessage, null, 2), 'utf-8');
        console.info(`Release message written to ${outputFilePath}`);
    } catch (err) {
        console.error(`Error writing the release message to file:`, err);
        process.exit(1);
    }
};

generateReleases();
