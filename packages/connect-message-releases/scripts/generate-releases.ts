import * as fs from 'fs/promises';
import * as path from 'path';

import { ConditionalRelease, ReleaseInfo, ReleaseMessage, ReleaseOriginal } from '../src/types';

function transformReleases(releases: ConditionalRelease[]): ReleaseMessage {
    return {
        version: 1,
        timestamp: new Date().toISOString(),
        sequence: 1,
        releases,
    };
}

function createFirmwareInfo(input: ReleaseOriginal, bitcoinOnly: boolean): ReleaseInfo {
    return {
        required: input.required ?? false,
        version: input.version,
        min_bootloader_version: input.min_bootloader_version,
        min_firmware_version: input.min_firmware_version,
        bootloader_version: input.bootloader_version,
        url: bitcoinOnly ? input.url_bitcoinonly : input.url,
        firmware_revision: input.firmware_revision,
        changelog: input.url_bitcoinonly ? input.changelog_bitcoinonly : input.changelog,
    };
}

const generateReleases = async () => {
    const firmwareTypes = ['t1b1', 't2b1', 't2t1', 't3b1', 't3t1'];
    const transformedReleases: ConditionalRelease[] = [];

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
            console.log('latestRelease', latestRelease);
            const releaseUniversal: ConditionalRelease = {
                firmware_type: 'universal',
                conditions: {
                    environment: {
                        desktop: '>=25.2.1',
                    },
                    rollout_probability: 100,
                },
                release: {
                    [firmwareType]: createFirmwareInfo(latestRelease, false),
                },
            };
            console.log('releaseUniversal', releaseUniversal);
            const releaseBitcoinOnly: ConditionalRelease = {
                firmware_type: 'bitcoin-only',
                conditions: [
                    {
                        environment: {
                            desktop: '>=25.2.1',
                        },
                        rollout_probability: 100,
                    },
                ],
                release: {
                    [firmwareType]: createFirmwareInfo(latestRelease, true),
                },
            };
            console.log('releaseBitcoinOnly', releaseBitcoinOnly);
            transformedReleases.push(releaseUniversal);
            transformedReleases.push(releaseBitcoinOnly);
            // console.log(`Transformed ConditionalRelease for ${firmwareType}:`, JSON.stringify(newRelease, null, 2));
        } catch (err) {
            console.error(`Error reading the file for ${firmwareType}:`, err);
        }
    }

    console.log('transformedReleases', JSON.stringify(transformedReleases, null, 2));
};

generateReleases();
