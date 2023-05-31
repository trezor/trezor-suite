/* eslint-disable global-require */

export const getAssetByUrl = (url: string) => {
    const fileUrl = url.split('?')[0];
    switch (fileUrl) {
        case './data/coins.json':
            return require('@trezor/connect-common/files/coins.json');
        case './data/bridge/releases.json':
            return require('@trezor/connect-common/files/bridge/releases.json');
        case './data/firmware/1/releases.json':
            return require('@trezor/connect-common/files/firmware/1/releases.json');
        case './data/firmware/2/releases.json':
            return require('@trezor/connect-common/files/firmware/2/releases.json');
        case './data/messages/messages.json':
            return require('@trezor/protobuf/messages.json');
        default:
            return null;
    }
};
