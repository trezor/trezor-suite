// https://github.com/trezor/connect/blob/develop/src/js/env/node/networkUtils.js

import fetch from 'cross-fetch';
import { promises as fs } from 'fs';
import { httpRequest as browserHttpRequest } from './assets-browser';

if (global && typeof global.fetch !== 'function') {
    global.fetch = fetch;
}

export const httpRequest = (url: string, type: string): any =>
    /^https?/.test(url) ? browserHttpRequest(url, type) : fs.readFile(url);
