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
    console.warn('---> try to parse?', json);
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
    const response = await fetch(requestUrl, {
        method,
        signal: options.signal,
        headers,
        // body: method === 'POST' ? JSON.stringify(body) : undefined,
    });
    // console.warn('RESPOOO', response);
    if (response.headers.get('content-type')?.includes('json')) {
        // console.warn('TRYIN json?', response.headers);
        return response.json();
    }

    // TRYIN json? Headers {
    //     [Symbol(map)]: [Object: null prototype] {
    //       connection: [ 'close' ],
    //       'content-type': [ 'application/json; charset=utf-8' ],
    //       date: [ 'Wed, 29 Jun 2022 12:50:35 GMT' ],
    //       server: [ 'Kestrel' ],
    //       'content-encoding': [ 'gzip' ],
    //       'transfer-encoding': [ 'chunked' ],
    //       vary: [ 'Accept-Encoding' ]
    //     }
    //   }

    // TRYIN json? Headers {
    //     [Symbol(map)]: [Object: null prototype] {
    //       server: [ 'SimpleHTTP/0.6 Python/3.7.3' ],
    //       date: [ 'Wed, 29 Jun 2022 12:50:05 GMT' ],
    //       'access-control-allow-origin': [ '*' ],
    //       'content-type': [ 'application/json; charset=utf-8' ],
    //       'content-encoding': [ 'gzip' ]
    //     }
    //   }

    const text = await response.text();
    if (response.ok) {
        // const json = typeof options.parseJson === 'boolean' ? options.parseJson : true;
        return parseResult(text, !!response.headers.get('content-type')?.includes('json'));
    }
    if (response.headers.get('content-type')?.includes('json')) {
        // NOTE: coordinator/middleware error shape {type: string, errorCode: string, description: string, exceptionData: { Type: string } }
        const { errorCode } = parseResult(text);
        throw new Error(errorCode || text);
    }
    const error = text ? `${response.statusText}: ${text}` : response.statusText;
    throw new Error(`${requestUrl} ${error}`);
};
