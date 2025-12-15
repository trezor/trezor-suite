import fetch from 'cross-fetch';

import { HttpRequestError } from './assetUtils';
import type { HttpRequestOptions, HttpRequestReturnType, HttpRequestType } from './assetsTypes';

/**
 * Http request wrapper for Suite Web & Desktop to handle various response states in a unified way.
 */
export const httpRequest = async <T extends HttpRequestType>(
    url: string,
    type: T = 'text' as T,
    options?: HttpRequestOptions,
): Promise<HttpRequestReturnType<T>> => {
    const init: RequestInit = { ...options, credentials: 'same-origin' };

    const response = await fetch(url, init);
    if (response.ok) {
        if (type === 'json') {
            const txt = await response.text();

            return JSON.parse(txt) as HttpRequestReturnType<T>;
        }
        if (type === 'binary') {
            return response.arrayBuffer() as Promise<HttpRequestReturnType<T>>;
        }

        return response.text() as Promise<HttpRequestReturnType<T>>;
    }

    throw new HttpRequestError(response);
};
