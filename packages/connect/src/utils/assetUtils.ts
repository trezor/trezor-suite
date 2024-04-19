import { DeviceModelInternal } from '../types';

export const getAssetByUrl = (url: string) => {
    const fileUrl = url.split('?')[0];

    switch (fileUrl) {
        case './data/coins.json':
            return require('@trezor/connect-common/files/coins.json');
        case './data/coins-eth.json':
            return require('@trezor/connect-common/files/coins-eth.json');
        case './data/bridge/releases.json':
            return require('@trezor/connect-common/files/bridge/releases.json');
        case './data/messages/messages.json':
            return require('@trezor/protobuf/messages.json');
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
