// https://github.com/trezor/connect/blob/develop/src/js/env/node/networkUtils.js

import fetch from 'cross-fetch';
import { promises as fs } from 'fs';
import { httpRequest as browserHttpRequest } from './assets-browser';
import { getAssetByUrl } from './assetUtils';

if (global && typeof global.fetch !== 'function') {
    global.fetch = fetch;
}

export const httpRequest = (url: string, _type: string): any => {
    const asset = getAssetByUrl(url);
    if (!asset) {
        return /^https?/.test(url) ? browserHttpRequest(url) : fs.readFile(url);
    }
    return asset;
};
