import { firmwareAssets } from '@trezor/connect-data';
import connectDataCoinsEth from '@trezor/connect-data/files/coins-eth.json';
import connectDataCoins from '@trezor/connect-data/files/coins.json';
import firmwareReleaseConfigAssetsJson from '@trezor/connect-data/files/firmware/release/releases.v1.json';
import type { DeviceModelInternal, FirmwareRelease } from '@trezor/device-utils';
import { FirmwareType } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

export class HttpRequestError extends Error {
    response: Response;

    constructor(response: Response) {
        const message = `${response.status} while fetching ${response.url}`;
        super(message);
        this.response = response;
    }
}

type FirmwareAssetMap = {
    [device: string]: {
        [type: string]: {
            [file: string]: FirmwareRelease;
        };
    };
};

export const getReleasesAssetByDeviceModelAndFirmwareType = (
    deviceModel: DeviceModelInternal,
    firmwareType: FirmwareType,
): FirmwareRelease[] => {
    const firmwareTypeInFileName =
        firmwareType === FirmwareType.BitcoinOnly ? 'bitcoinonly' : 'universal';

    const availableReleasesRecord =
        (firmwareAssets as FirmwareAssetMap)?.[deviceModel.toLowerCase()]?.[
            firmwareTypeInFileName
        ] ?? {};

    return Object.values(availableReleasesRecord).sort((a, b) =>
        versionUtils.isNewer(b.version, a.version) ? 1 : -1,
    );
};

export const getReleaseAsset = (
    deviceModel: DeviceModelInternal,
    version: VersionArray,
    firmwareType: FirmwareType,
) => {
    const firmwareTypeInFileName =
        firmwareType === FirmwareType.BitcoinOnly ? 'bitcoinonly' : 'universal';
    const fileName = `${deviceModel.toLowerCase()}-${version.join('.')}-${firmwareTypeInFileName}`;
    const deviceModelLower = deviceModel.toLowerCase();

    const asset = (firmwareAssets as FirmwareAssetMap)?.[deviceModelLower]?.[
        firmwareTypeInFileName
    ]?.[fileName];

    return asset as FirmwareRelease;
};

export const firmwareReleaseConfigAssets = firmwareReleaseConfigAssetsJson as any;

export const tryLocalAssetRequire = (url: string): unknown => {
    const fileUrl = url.split('?')[0];

    switch (fileUrl) {
        case './data/coins.json':
            return connectDataCoins;
        case './data/coins-eth.json':
            return connectDataCoinsEth;
    }

    return null;
};
