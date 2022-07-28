import fetch from 'cross-fetch';

export interface RequestOptions {
    method?: 'POST' | 'GET';
    baseUrl?: string;
    signal?: AbortSignal;
    delay?: number;
    identity?: string;
}

export const httpRequest = async (
    url: string,
    body: Record<string, any>,
    options: RequestOptions = {},
) => {
    const baseUrl = options.baseUrl || '';
    const headers: HeadersInit = {
        'Content-Type': 'application/json-patch+json',
    };
    // if (options.identity) {
    //     // TODO: probably will be extended:
    //     // - fallback clearnet url, number of retries...
    //     headers['Proxy-Authorization'] = `Basic ${options.identity}`;
    // }

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
    const query = method === 'GET' && body ? `?${new URLSearchParams(body)}` : '';
    const requestUrl = `${baseUrl}${url}${query}`;
    return fetch(requestUrl, {
        method,
        signal: options.signal,
        headers,
    });
};
