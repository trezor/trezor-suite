/* eslint-disable global-require */

// https://github.com/trezor/connect/blob/develop/src/js/env/node/networkUtils.js

import fetch from 'cross-fetch';

if (global && typeof global.fetch !== 'function') {
    global.fetch = fetch;
}

export const httpRequest = (url: string, _type: string): any => {
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
            return require('@trezor/transport/messages.json');
        default:
            return null;
    }
};
