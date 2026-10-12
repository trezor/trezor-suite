import { type VersionArray, versionUtils } from '@trezor/utils';

import { type DefinitionsChannel } from '../types/definitions';

// Format version of the signed definitions. The payloads are identical, but v1 needs two
// signatures and v2 needs one.
export type DefinitionsVersion = 1 | 2;

// Core accepts v2 since 2.13.0. Legacy accepts only v2 since 1.14.2.
const DEFINITIONS_V2_MIN_FIRMWARE = ['1.14.2', '2.13.0'];

export const getDefinitionsVersionForFirmware = (
    firmwareVersion: VersionArray | undefined,
): DefinitionsVersion => {
    const minFirmware = firmwareVersion && DEFINITIONS_V2_MIN_FIRMWARE[firmwareVersion[0] - 1];

    return minFirmware && versionUtils.isNewerOrEqual(firmwareVersion, minFirmware) ? 2 : 1;
};

// Production serves v1 from the original unversioned path, which released clients depend on.
export const getProductionDefinitionsUrl = (version: DefinitionsVersion) =>
    version === 1
        ? 'https://data.trezor.io/firmware/definitions'
        : `https://data.trezor.io/firmware/definitions/v${version}`;

export const getDevelopmentDefinitionsUrl = (version: DefinitionsVersion) =>
    `https://dev.firmware.sldev.cz/definitions/v${version}`;

export const getEthereumDefinitionsBaseUrl = (
    version: DefinitionsVersion,
    channel: DefinitionsChannel = 'production',
) => {
    switch (channel) {
        case 'production':
            return `${getProductionDefinitionsUrl(version)}/eth`;
        case 'development':
            return `${getDevelopmentDefinitionsUrl(version)}/eth`;
        case 'local':
            return 'http://localhost:3000';
        default:
            throw new Error(`Unknown channel: ${channel}`);
    }
};
