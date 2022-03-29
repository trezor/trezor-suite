/* eslint-disable global-require */
import fetch from 'cross-fetch';

// REF-TODO
// This file is a combination of both
// https://github.com/trezor/connect/blob/develop/src/js/env/browser/networkUtils.js
// https://github.com/trezor/connect/blob/develop/src/js/env/node/networkUtils.js

export const httpRequestNode = (url: string) => {
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

export const httpRequest = async (url: string, type = 'text') => {
    if (typeof navigator === 'undefined') return httpRequestNode(url);
    const response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
        if (type === 'json') {
            const txt = await response.text();
            return JSON.parse(txt);
        }
        if (type === 'binary') {
            return response.arrayBuffer();
        }
        return response.text();
    }
    throw new Error(`httpRequest error: ${url} ${response.statusText}`);
};
