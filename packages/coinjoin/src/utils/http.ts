import fetch from 'cross-fetch';

import { ScheduleActionParams, getWeakRandomId } from '@trezor/utils';

export interface RequestOptions extends ScheduleActionParams {
    method?: 'POST' | 'GET';
    baseUrl?: string;
    signal?: AbortSignal;
    identity?: string;
    userAgent?: string;
}

const camelCaseToPascalCase = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);

export const patchResponse = (obj: any) => {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            patchResponse(obj[i]);
        }
    } else if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
            const newKey = camelCaseToPascalCase(key);
            obj[newKey] = obj[key];
            if (key !== newKey) {
                delete obj[key];
            }
            // skip whole AffiliateData object because:
            // - keys are Round.Id hash and should not be PascalCased
            // - values contains affiliate flag "trezor" which is not in PascalCased
            // AffiliateData: { abcd0123: { trezor: 'base64=' } };
            if (newKey !== 'AffiliateData') {
                patchResponse(obj[newKey]);
            }
        });
    }

    return obj;
};

const createHeaders = (options: RequestOptions) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept-Encoding': 'gzip',
    };
    // add custom headers to requests which are intercepted by @trezor/request-manager package.
    // - Proxy-Authorization: used to create/use TOR circuit
    // - Allowed-Headers: used to restrict headers sent to wabisabi api
    // custom headers works only in nodejs environment (suite-desktop). browser throws: Refused to set unsafe header "proxy-authorization" error
    if (options.identity) {
        headers['Proxy-Authorization'] = `Basic ${options.identity}`;
        headers['Allowed-Headers'] = 'Accept-Encoding;Content-Type;Content-Length;Host';
    }
    // blockbook api requires 'User-Agent' to be set
    // same as in @trezor/blockchain-link/src/workers/blockbook/websocket
    if (typeof options.userAgent === 'string') {
        headers['User-Agent'] = options.userAgent || 'Trezor Suite';
    }

    return headers;
};

export const httpGet = (url: string, query?: Record<string, any>, options: RequestOptions = {}) => {
    const queryString = query ? `?${new URLSearchParams(query)}` : '';

    return fetch(`${url}${queryString}`, {
        method: 'GET',
        signal: options.signal,
        headers: createHeaders(options),
    });
};

export const httpPost = (url: string, body?: Record<string, any>, options: RequestOptions = {}) =>
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        signal: options.signal,
        headers: createHeaders(options),
    });

// Randomize identity password to reset TOR circuit for this identity
export const resetIdentityCircuit = (identity: string) => {
    const [user] = identity.split(':');

    return `${user}:${getWeakRandomId(16)}`;
};
