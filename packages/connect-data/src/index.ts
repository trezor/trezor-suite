import type { FirmwareRelease } from '@trezor/device-utils';

import { firmwareAssets as _firmwareAssets } from './map-releases';

export * from './firmware-jws';

type FirmwareAssetsMap = {
    [device: string]: {
        [type: string]: {
            [file: string]: FirmwareRelease;
        };
    };
};

export const firmwareAssets = _firmwareAssets as unknown as FirmwareAssetsMap;
