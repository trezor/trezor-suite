import type { Device } from '../device/Device';

// Format version of the signed definitions. The payloads are identical, but v1 needs two
// signatures and v2 needs one.
export type DefinitionsVersion = 1 | 2;

// Core accepts v2 since 2.13.0. Legacy accepts only v2 since 1.14.2.
const DEFINITIONS_V2_MIN_FIRMWARE = ['1.14.2', '2.13.0'];

export const getDefinitionsVersion = (device: Device): DefinitionsVersion =>
    device.atLeast(DEFINITIONS_V2_MIN_FIRMWARE) ? 2 : 1;

// Production serves v1 from the original unversioned path, which released clients depend on.
export const getProductionDefinitionsUrl = (version: DefinitionsVersion) =>
    version === 1
        ? 'https://data.trezor.io/firmware/definitions'
        : `https://data.trezor.io/firmware/definitions/v${version}`;

export const getDevelopmentDefinitionsUrl = (version: DefinitionsVersion) =>
    `https://dev.firmware.sldev.cz/definitions/v${version}`;
