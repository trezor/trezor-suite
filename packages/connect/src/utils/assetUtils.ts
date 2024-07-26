import { DeviceModelInternal } from '../types';

const isDeviceModel = (model: string): model is DeviceModelInternal => {
    return Object.values(DeviceModelInternal).includes(model as DeviceModelInternal);
};

const firmwareAssets: Record<DeviceModelInternal, NodeRequire> = {
    [DeviceModelInternal.T1B1]: require('@trezor/connect-common/files/firmware/t1b1/releases.json'),
    [DeviceModelInternal.T2T1]: require('@trezor/connect-common/files/firmware/t2t1/releases.json'),
    [DeviceModelInternal.T2B1]: require('@trezor/connect-common/files/firmware/t2b1/releases.json'),
    [DeviceModelInternal.T3B1]: require('@trezor/connect-common/files/firmware/t3b1/releases.json'),
    [DeviceModelInternal.T3T1]: require('@trezor/connect-common/files/firmware/t3t1/releases.json'),
};

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

    const firmwareMatch = fileUrl.match(/\/firmware\/(\w+)\/releases\.json$/);
    if (firmwareMatch) {
        const modelKey = firmwareMatch[1].toUpperCase();
        if (isDeviceModel(modelKey)) {
            return firmwareAssets[modelKey];
        }
    }

    return null;
};
