import {
    DeviceModelInternal,
    FirmwareRelease,
    FirmwareType,
    VersionArray,
} from '@trezor/device-utils';

export const getReleaseAsset = (
    deviceModel: DeviceModelInternal,
    version: VersionArray,
    firmwareType: FirmwareType,
) => {
    const firmwareTypeInFileName =
        firmwareType === FirmwareType.BitcoinOnly ? 'bitcoinonly' : 'universal';
    const fileName = `${deviceModel.toLowerCase()}-${version.join('.')}-${firmwareTypeInFileName}.json`;
    const deviceLower = deviceModel.toLowerCase();

    const asset = require(
        /* webpackInclude: /\.json$/ */
        /* webpackChunkName: "firmware" */
        /* webpackMode: "lazy" */
        `@trezor/connect-common/files/firmware/${deviceLower}/${firmwareTypeInFileName}/${fileName}`,
    );

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
