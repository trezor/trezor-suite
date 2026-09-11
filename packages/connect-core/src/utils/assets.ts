import fetch from 'cross-fetch';
import { promises as fs } from 'fs';

import { httpRequest as browserHttpRequest, tryLocalAssetRequire } from './assetUtils';
import type { HttpRequestOptions, HttpRequestReturnType, HttpRequestType } from './assetsTypes';

if (global && typeof global.fetch !== 'function') {
    global.fetch = fetch;
}

/**
 * Http request wrapper for Suite Web & Desktop, that first tries to read files locally (unless forced to skip),
 * then fetches from remote source.
 *
 * ATTENTION !!! For suite-native, see assets.native.ts
 * (automatically replaced by bundler, no explicit import)
 */
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
