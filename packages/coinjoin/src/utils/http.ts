import fetch from 'cross-fetch';

import { throwError } from '@trezor/utils';

export interface RequestOptions {
    method?: 'POST' | 'GET';
    baseUrl?: string;
    signal?: AbortSignal;
    parseJson?: boolean;
    delay?: number;
    identity?: string;
    userAgent?: string;
}

const parseResult = (text: string, json = true) => {
    if (!json) return text;
    return JSON.parse(text);
};

type ControlRequestParams = {
    delay?: number; // How many ms wait before calling action (default = none)
    timeout?: number; // How many ms wait for a single action attempt (default = indefinitely)
    deadline?: number; // How many ms wait for all action attempts (default = indefinitely)
    attempts?: number; // How many attempts before failure (default = one, or infinite when deadline is set)
    signal?: AbortSignal;
};

const controlRequest = async <T>(
    request: (signal?: AbortSignal) => Promise<T>,
    { delay, timeout, deadline, attempts, signal }: ControlRequestParams,
) => {
    if (delay) {
        await new Promise<void>((resolve, reject) => {
            let delayTimeout: ReturnType<typeof setTimeout>;
            const abortDelay = () => {
                clearTimeout(delayTimeout);
                reject(new Error('The user aborted a request.'));
            };
            signal?.addEventListener('abort', abortDelay);
            delayTimeout = setTimeout(() => {
                signal?.removeEventListener('abort', abortDelay);
                resolve();
            }, delay);
        });
    }

    const deadlineAborter = new AbortController();
    const abortDeadline = () => deadlineAborter.abort();
    if (signal?.aborted) abortDeadline();
    const deadlineTimeout = deadline ? setTimeout(abortDeadline, deadline) : undefined;
    signal?.addEventListener('abort', abortDeadline);

    const attempt = () => {
        const attemptAborter = new AbortController();
        const abortAttempt = () => attemptAborter.abort();
        const attemptTimeout = timeout ? setTimeout(abortAttempt, timeout) : undefined;
        deadlineAborter.signal.addEventListener('abort', abortAttempt);
        return request(attemptAborter.signal).finally(() => {
            deadlineAborter.signal.removeEventListener('abort', abortAttempt);
            clearTimeout(attemptTimeout);
        });
    };

    const attemptsRecursive = (attemptsLeft: number): ReturnType<typeof attempt> =>
        attemptsLeft && !deadlineAborter.signal.aborted
            ? attempt().catch(() => attemptsRecursive(attemptsLeft - 1))
            : throwError('The user aborted a request');

    return attemptsRecursive(attempts ?? (deadline ? Infinity : 1)).finally(() => {
        signal?.removeEventListener('abort', abortDeadline);
        clearTimeout(deadlineTimeout);
    });
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

    const request = async (signal?: AbortSignal) => {
        const response = await httpPost(`${baseUrl}${url}`, body, { ...options, signal });
        const text = await response.text();
        return { response, text };
    };

    const { response, text } = await controlRequest(request, options);

    if (response.ok) {
        const json = typeof options.parseJson === 'boolean' ? options.parseJson : true;
        return parseResult(text, json);
    }
    if (response.headers.get('content-type')?.includes('json')) {
        // NOTE: coordinator/middleware error shape {type: string, errorCode: string, description: string, exceptionData: { Type: string } }
        const { errorCode } = parseResult(text);
        throw new Error(errorCode || text);
    }
    const error = text ? `${response.statusText}: ${text}` : response.statusText;
    throw new Error(`${baseUrl}${url} ${error}`);
};
