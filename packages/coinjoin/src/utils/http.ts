import fetch from 'cross-fetch';

import { scheduleAction, ScheduleActionParams } from '@trezor/utils';

import { HTTP_REQUEST_TIMEOUT } from '../constants';

export interface RequestOptions extends ScheduleActionParams {
    method?: 'POST' | 'GET';
    baseUrl?: string;
    signal?: AbortSignal;
    identity?: string;
    userAgent?: string;
}

const parseResult = (headers: Headers, text: string) => {
    if (headers.get('content-type')?.includes('json')) {
        try {
            return JSON.parse(text);
        } catch (e) {
            // fall down and return text
        }
    }
    return text;
};

const createHeaders = (options: RequestOptions) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json-patch+json',
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

// Requests to wasabi coordinator and middleware (CoinjoinClientLibrary bin)
export const coordinatorRequest = async <R = void>(
    url: string,
    body: Record<string, any>,
    options: RequestOptions = {},
): Promise<R> => {
    const baseUrl = options.baseUrl || '';

    const switchIdentity = () => {
        if (options.identity) {
            // set random password to reset TOR circuit for this identity and then try again
            const [user] = options.identity.split(':');
            options.identity = `${user}:${Math.random()}`;
        }
    };

    const request = async (signal?: AbortSignal) => {
        let response;
        try {
            response = await httpPost(`${baseUrl}${url}`, body, { ...options, signal });
        } catch (e) {
            if ('code' in e && e.code === 'ECONNRESET') {
                // catch errors from nodejs http module like "socket hang up" or "socket disconnected before secure TLS connection was established" etc.
                // When sending request through a keep-alive enabled agent the underlying socket might be reused.
                // But if server closes connection at unfortunate time client may run into a 'ECONNRESET' error.
                // each case explanation in ./node_modules/@types/node/*/http.d.ts
                switchIdentity();
            } else if (options.deadline) {
                // prevent dead cycles while using "deadline" option in scheduledAction
                // catch fetch runtime errors like ECONNREFUSED or blocked by @trezor/request-manager
                // and stop scheduledAction. those errors will not be resolved by retrying
                return { error: e as Error };
            }
            throw e;
        }

        // throw unexpected network errors => retry scheduledAction
        if (![200, 404, 500].includes(response.status)) {
            if (response.status === 403) {
                // NOTE: possibly blocked by cloudflare
                switchIdentity();
            }
            // log to app console and sentry if possible
            console.error(`Unexpected error ${response.status} request to ${url}`);
            throw new Error(`${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        return { response, text };
    };

    const { response, text, error } = await scheduleAction(request, {
        timeout: HTTP_REQUEST_TIMEOUT, // allow timeout override by options
        ...options,
    });

    if (error) {
        throw error;
    }

    const result = parseResult(response.headers, text);
    if (response.ok) {
        return result;
    }

    // catch WabiSabiProtocolException
    if (typeof result !== 'string' && result.errorCode) {
        // NOTE: coordinator/middleware error shape {type: string, errorCode: string, description: string, exceptionData: { Type: string } }
        throw new Error(result.errorCode);
    }

    // fallback error
    const message = text ? `${response.statusText}: ${text}` : response.statusText;
    throw new Error(`${baseUrl}${url} ${message}`);
};
