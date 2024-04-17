import { DeviceModelInternal } from '../types';

export const getAssetByUrl = (url: string) => {
    const fileUrl = url.split('?')[0];

    // Static mappings for non-dynamic assets
    const staticAssets: { [key: string]: string } = {
        './data/coins.json': '@trezor/connect-common/files/coins.json',
        './data/coins-eth.json': '@trezor/connect-common/files/coins-eth.json',
        './data/bridge/releases.json': '@trezor/connect-common/files/bridge/releases.json',
        './data/messages/messages.json': '@trezor/protobuf/messages.json',
    };

    if (staticAssets[fileUrl]) {
        return require(staticAssets[fileUrl]);
    }

    // Handle dynamic firmware URLs using the DeviceModelInternal enum
    const firmwareMatch = fileUrl.match(/\/firmware\/(\w+)\/releases\.json$/);
    if (firmwareMatch) {
        const modelKey = firmwareMatch[1].toUpperCase();
        if (Object.values(DeviceModelInternal).includes(modelKey as DeviceModelInternal)) {
            return require(
                `@trezor/connect-common/files/firmware/${modelKey.toLowerCase()}/releases.json`,
            );
        }
    }

    return null;
};
