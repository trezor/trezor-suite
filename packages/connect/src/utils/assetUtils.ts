export const getAssetByUrl = (url: string) => {
    const fileUrl = url.split('?')[0];
    switch (fileUrl) {
        case './data/coins.json':
            return require('@trezor/connect-common/files/coins.json');
        case './data/coins-eth.json':
            return require('@trezor/connect-common/files/coins-eth.json');
        case './data/bridge/releases.json':
            return require('@trezor/connect-common/files/bridge/releases.json');
        case './data/firmware/t1b1/releases.json':
            return require('@trezor/connect-common/files/firmware/t1b1/releases.json');
        case './data/firmware/t2t1/releases.json':
            return require('@trezor/connect-common/files/firmware/t2t1/releases.json');
        case './data/firmware/t2b1/releases.json':
            return require('@trezor/connect-common/files/firmware/t2b1/releases.json');
        case './data/messages/messages.json':
            return require('@trezor/protobuf/messages.json');
        default:
            return null;
    }
};
