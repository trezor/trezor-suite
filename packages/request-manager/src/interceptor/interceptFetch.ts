// TODO: Nodejs fetch APIs use undici which is based on totally different design,
// proxy-agent package is not compatible with undici, and can only be used with
// old API like http.request.
// See issue: https://github.com/TooTallNate/proxy-agents/issues/239 .
import type { RequestOptions } from 'https';
import nodeFetch, { type RequestInit } from 'node-fetch';

import { Interceptor } from './interceptorTypes';
import { getIsTorRequired } from './overloadHttpRequest';

export const interceptFetch: Interceptor = ({ context, validateRequest }) => {
    const originalFetch = global.fetch;

    global.fetch = (url, options): Promise<Response> => {
        const isTorEnabled = context.getTorSettings().running;
        const isTorRequired = getIsTorRequired(options as Readonly<RequestOptions>);

        if (isTorEnabled || isTorRequired) {
            return nodeFetch(url as string, options as RequestInit) as Promise<any>;
        }

        let hostname = 'unknown';
        if (typeof url === 'object' && 'hostname' in url) {
            // case url type of URL
            hostname = url.hostname;
        } else if (typeof url === 'object' && 'url' in url) {
            // case url type of globalThis.Request
            hostname = url.url;
        } else if (typeof url === 'string') {
            // case url type of string
            hostname = new URL(url).hostname;
        }

        validateRequest({ hostname });

        return originalFetch(url, options);
    };
};
