import fetch from 'cross-fetch';

export interface RequestOptions {
    method?: 'POST' | 'GET';
    baseUrl?: string;
    signal?: AbortSignal;
    parseJson?: boolean;
    delay?: number;
    identity?: string;
}

const parseResult = (text: string, json = true) => {
    if (!json) return text;
    return JSON.parse(text);
};

const requestDelay = async (options: RequestOptions) => {
    const delay = options.delay || 0;
    if (delay > 0) {
        await new Promise<void>((resolve, reject) => {
            let timeout: ReturnType<typeof setTimeout> | undefined;
            const abortHandler = () => {
                if (timeout) {
                    clearTimeout(timeout);
                    reject(new Error('The user aborted a request.'));
                }
            };
            options.signal?.addEventListener('abort', abortHandler);
            timeout = setTimeout(() => {
                timeout = undefined;
                options.signal?.removeEventListener('abort', abortHandler);
                resolve();
            }, delay);
        });
    }
};

const identities: string[] = [];

const createHeaders = (options: RequestOptions) => {
    let identity = Date.now().toString();
    if (identities.length > 5) {
        // eslint-disable-next-line prefer-destructuring
        identity = identities[2];
    } else {
        identities.push(identity);
    }

    console.warn('---> Request with identity', identity, identities);
    const headers: HeadersInit = {
        'Content-Type': 'application/json-patch+json',
        'User-Agent': `Trezor Suite, identity:${identity}`,
    };
    if (options.identity) {
        // TODO: probably will be extended:
        // - fallback clearnet url, number of retries...
        headers['Proxy-Authorization'] = `Basic ${options.identity}`;
    }
    return headers;
};

export const httpGet = async (
    url: string,
    query?: Record<string, any>,
    options: RequestOptions = {},
) => {
    const queryString = query ? `?${new URLSearchParams(query)}` : '';
    await requestDelay(options);
    return fetch(`${url}${queryString}`, {
        method: 'GET',
        signal: options.signal,
        headers: createHeaders(options),
    });
};

export const httpPost = async (
    url: string,
    body?: Record<string, any>,
    options: RequestOptions = {},
) => {
    await requestDelay(options);
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        signal: options.signal,
        headers: createHeaders(options),
    });
};

export const httpRequest = async <R = void>(
    url: string,
    body: Record<string, any>,
    options: RequestOptions = {},
): Promise<R> => {
    const baseUrl = options.baseUrl || '';

    const method = options.method || 'POST';
    if (method === 'GET') {
        return httpGet(`${baseUrl}${url}`, body, options) as any; // TODO: response type
    }

    const response = await httpPost(`${baseUrl}${url}`, body, options);

    const text = await response.text();
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
