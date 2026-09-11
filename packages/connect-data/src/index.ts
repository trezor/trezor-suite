import type { FirmwareReleaseConfig } from '@trezor/device-utils';

import firmwareReleaseConfigAssetsJson from '../files/firmware/release/releases.v1.json';

export * from './firmware-jws';
export { firmwareAssets } from './map-releases';

export const firmwareReleaseConfigAssets = firmwareReleaseConfigAssetsJson as FirmwareReleaseConfig;
