// https://github.com/trezor/connect/blob/develop/src/js/env/node/networkUtils.js

import fetch from 'cross-fetch';
import { promises as fs } from 'fs';
import { httpRequest as browserHttpRequest } from './assets-browser';
import { getAssetByUrl } from './assetUtils';

if (global && typeof global.fetch !== 'function') {
    global.fetch = fetch;
}

export function httpRequest(url: string, type: 'text'): Promise<string>;
export function httpRequest(url: string, type: 'binary'): Promise<ArrayBuffer>;
export function httpRequest(url: string, type: 'json'): Promise<Record<string, any>>;
export function httpRequest(url: any, type: any) {
    const asset = getAssetByUrl(url);
    if (!asset) {
        return /^https?/.test(url) ? browserHttpRequest(url, type) : fs.readFile(url);
    }

    return asset;
}
