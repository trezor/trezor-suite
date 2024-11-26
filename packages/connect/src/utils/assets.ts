import fetch from 'cross-fetch';
import { promises as fs } from 'fs';

import { httpRequest as browserHttpRequest } from './assets-browser';
import { HttpRequestOptions, HttpRequestReturnType, HttpRequestType } from './assetsTypes';
import { tryLocalAssetRequire } from './assetUtils';

if (global && typeof global.fetch !== 'function') {
    global.fetch = fetch;
}

export function httpRequest<T extends HttpRequestType>(
    url: string,
    type: T,
    options?: HttpRequestOptions,
): Promise<HttpRequestReturnType<T>> {
    const asset = options?.skipLocalForceDownload ? null : tryLocalAssetRequire(url);

    if (!asset) {
        return /^https?/.test(url)
            ? browserHttpRequest(url, type, options)
            : (fs.readFile(url) as Promise<HttpRequestReturnType<T>>);
    }

    return asset as Promise<HttpRequestReturnType<T>>;
}
