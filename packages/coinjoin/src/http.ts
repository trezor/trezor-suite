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

export const httpRequest = async <R = void>(
    url: string,
    body: Record<string, any>,
    options: RequestOptions = {},
): Promise<R> => {
    const baseUrl = options.baseUrl || '';
    const headers: HeadersInit = {
        'Content-Type': 'application/json-patch+json',
    };
    if (options.identity) {
        // TODO: probably will be extended:
        // - fallback clearnet url, number of retries...
        headers['Proxy-Authorization'] = `Basic ${options.identity}`;
    }

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

    const method = options.method || 'POST';
    if (method === 'GET') {
        const query = body ? `?${new URLSearchParams(body)}` : '';
        const requestUrl = `${baseUrl}${url}${query}`;
        return fetch(requestUrl, {
            method,
            signal: options.signal,
            headers,
        }) as any; // TODO: response type
    }

    const requestUrl = `${baseUrl}${url}`;
    const response = await fetch(requestUrl, {
        method: options.method || 'POST',
        signal: options.signal,
        headers,
        body: JSON.stringify(body),
    });

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
    throw new Error(`${requestUrl} ${error}`);
};
