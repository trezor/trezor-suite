import fetch from 'cross-fetch';

import { HttpRequestType, HttpRequestReturnType, HttpRequestOptions } from './assetsTypes';

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

    throw new Error(`httpRequest error: ${url} ${response.statusText}`);
};
