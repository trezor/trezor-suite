import { firmwareAssets } from '@trezor/connect-common/files/firmware';
import {
    DeviceModelInternal,
    FirmwareRelease,
    FirmwareType,
    VersionArray,
} from '@trezor/device-utils';

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
) => {
    const firmwareTypeInFileName =
        firmwareType === FirmwareType.BitcoinOnly ? 'bitcoinonly' : 'universal';

    return (firmwareAssets as FirmwareAssetMap)[deviceModel.toLowerCase()][firmwareTypeInFileName];
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

export const firmwareReleaseConfigAssets = require('@trezor/connect-common/files/firmware/release/releases.v1.json');

export const tryLocalAssetRequire = (url: string) => {
    const fileUrl = url.split('?')[0];

    switch (fileUrl) {
        case './data/coins.json':
            return require('@trezor/connect-common/files/coins.json');
        case './data/coins-eth.json':
            return require('@trezor/connect-common/files/coins-eth.json');
        case './data/messages/messages.json':
            return require('@trezor/protobuf/messages.json');
    }

    return null;
};
