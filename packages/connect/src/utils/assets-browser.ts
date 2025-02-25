import fetch from 'cross-fetch';

import { HttpRequestOptions, HttpRequestReturnType, HttpRequestType } from './assetsTypes';

export class HttpRequestError extends Error {
    response: Response;

    constructor(response: Response) {
        const message = `${response.status} while fetching ${response.url}`;
        super(message);
        this.response = response;
    }
}

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
