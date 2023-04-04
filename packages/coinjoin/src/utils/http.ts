import fetch from 'cross-fetch';

import { ScheduleActionParams } from '@trezor/utils';

export interface RequestOptions extends ScheduleActionParams {
    method?: 'POST' | 'GET';
    baseUrl?: string;
    signal?: AbortSignal;
    identity?: string;
    userAgent?: string;
}

const createHeaders = (options: RequestOptions) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    // add custom header to define TOR identity.
    // request is intercepted by @trezor/request-manager and requested identity is used to create TOR circuit
    // header works only in nodejs environment (suite-desktop). browser throws: Refused to set unsafe header "proxy-authorization" error
    if (options.identity) {
        headers['Proxy-Authorization'] = `Basic ${options.identity}`;
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
