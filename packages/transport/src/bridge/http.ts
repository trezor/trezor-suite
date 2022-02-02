export type HttpRequestOptions = {
    body?: Array<any> | Record<string, unknown> | string;
    url: string;
    method: 'POST' | 'GET';
    skipContentTypeHeader?: boolean;
};

// slight hack to make Flow happy, but to allow Node to set its own fetch
// Request, RequestOptions and Response are built-in types of Flow for fetch API
let _fetch: (input: string | Request, init?: any) => Promise<Response> =
    typeof window === 'undefined' ? () => Promise.reject() : window.fetch;

let _isNode = false;

export function setFetch(fetch: any, isNode?: boolean) {
    _fetch = fetch;
    _isNode = !!isNode;
}

function contentType(body: any) {
    if (typeof body === 'string') {
        if (body === '') {
            return 'text/plain';
        }
        return 'application/octet-stream';
    }
    return 'application/json';
}

function wrapBody(body: any) {
    if (typeof body === 'string') {
        return body;
    }
    return JSON.stringify(body);
}

function parseResult(text: string) {
    try {
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
}

export async function request(options: HttpRequestOptions) {
    const fetchOptions = {
        method: options.method,
        body: wrapBody(options.body),
        credentials: 'same-origin',
        headers: {},
    };

    // this is just for flowtype
    if (options.skipContentTypeHeader == null || options.skipContentTypeHeader === false) {
        fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': contentType(options.body == null ? '' : options.body),
        };
    }

    // Node applications must spoof origin for bridge CORS
    if (_isNode) {
        fetchOptions.headers = {
            ...fetchOptions.headers,
            Origin: 'https://node.trezor.io',
        };
    }

    const res = await _fetch(options.url, fetchOptions);
    const resText = await res.text();
    if (res.ok) {
        return parseResult(resText);
    }
    const resJson = parseResult(resText);
    if (typeof resJson === 'object' && resJson != null && resJson.error != null) {
        throw new Error(resJson.error);
    } else {
        throw new Error(resText);
    }
}
