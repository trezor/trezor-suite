/* @flow */
import urlConstants from 'constants/urls';
import type { TrezorDevice } from 'flowtype';

const getOldWalletUrl = (device: ?TrezorDevice): string => {
    if (!device || !device.firmwareRelease) return urlConstants.OLD_WALLET_BETA;
    const release = device.firmwareRelease;
    const url = release.channel === 'beta' ? urlConstants.OLD_WALLET_BETA : urlConstants.OLD_WALLET;
    return url;
};

// TODO: use uri template to build urls
const getOldWalletReleaseUrl = (device: ?TrezorDevice): string => {
    if (!device || !device.firmwareRelease) return urlConstants.OLD_WALLET_BETA;
    const release = device.firmwareRelease;
    const url = getOldWalletUrl(device);
    const version = release.version.join('.');
    return `${url}?fw=${version}`;
};

export {
    getOldWalletUrl,
    getOldWalletReleaseUrl,
};