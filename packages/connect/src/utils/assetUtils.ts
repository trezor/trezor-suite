import { firmwareAssets } from '@trezor/connect-data';
import {
    DeviceModelInternal,
    FirmwareRelease,
    FirmwareType,
    VersionArray,
} from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

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

export const firmwareReleaseConfigAssets = require('@trezor/connect-data/files/firmware/release/releases.v1.json');

export const tryLocalAssetRequire = (url: string): unknown => {
    const fileUrl = url.split('?')[0];

    switch (fileUrl) {
        case './data/coins.json':
            return require('@trezor/connect-data/files/coins.json');
        case './data/coins-eth.json':
            return require('@trezor/connect-data/files/coins-eth.json');
        case './data/messages/messages.json':
            return require('@trezor/protobuf/messages.json');
    }

    return null;
};
