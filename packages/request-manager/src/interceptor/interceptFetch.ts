// Node's global `fetch` is backed by undici, which - unlike the legacy `http`/`https` modules - does
// not go through this package's `http.request` interception.
// Using native nodejs undici's `Socks5ProxyAgent` to route Tor traffic.
// https://github.com/nodejs/undici/blob/main/docs/docs/api/Socks5ProxyAgent.md
import { fetch as undiciFetch } from 'undici';

import { isWhitelistedHost } from '@trezor/utils';

import { buildTorHeaders, getHeaderValue } from './fetchHeaders';
import { monitorFetch } from './fetchPool';
import { type Interceptor } from './interceptorTypes';
import { getIdentityName } from './overloadHttpRequest';

const resolveHostname = (url: RequestInfo | URL) => {
    if (typeof url === 'object' && 'hostname' in url) {
        // case url type of URL
        return url.hostname;
    }
    if (typeof url === 'object' && 'url' in url) {
        // case url type of globalThis.Request
        return new URL(url.url).hostname;
    }
    if (typeof url === 'string') {
        // case url type of string
        return new URL(url).hostname;
    }

    return 'unknown';
};

export const interceptFetch: Interceptor = ({ context, validateRequest }) => {
    const originalFetch = global.fetch;

    global.fetch = (url, options) => {
        // Native `fetch` never throws synchronously, it always returns a promise.
        try {
            const isTorEnabled = context.getTorSettings().running;
            const proxyAuthorization = getHeaderValue(options?.headers, 'Proxy-Authorization');
            const isTorRequired = proxyAuthorization !== undefined;
            const headers = buildTorHeaders(options?.headers);
            const fetchOptions = { ...options, headers };

            const hostname = resolveHostname(url);
            validateRequest({ hostname });

            // Hosts that don't require Tor (e.g. localhost, dev domains) connect directly, matching the
            // behavior of the http(s) interceptor in `overloadHttpRequest`.
            if (isWhitelistedHost(hostname, context.notRequiredTorDomainsList)) {
                return originalFetch(url, fetchOptions);
            }

            if (!isTorEnabled) {
                if (isTorRequired && !context.allowTorBypass) {
                    throw new Error('Blocked request with Proxy-Authorization. TOR not enabled.');
                }

                return originalFetch(url, fetchOptions);
            }

            // Use the Proxy-Authorization header to select the Tor circuit, falling back to 'default'.
            const identity = getIdentityName(proxyAuthorization) || 'default';
            const dispatcher = context.torIdentities.getDispatcher(identity);

            context.handler({
                type: 'INTERCEPTED_REQUEST',
                method: 'fetch',
                details: `${hostname} with identity ${identity}`,
            });

            // The type mismatch is a TypeScript artifact:
            // the compiler sees lib.dom.Request/Response as different from undici.Request even though at runtime in Node.js they're the same class.
            const request = undiciFetch(
                ...([
                    url,
                    {
                        ...fetchOptions,
                        dispatcher,
                    },
                ] as Parameters<typeof undiciFetch>),
            );

            return monitorFetch({
                context,
                host: hostname,
                identity,
                request,
            }) as unknown as Promise<Response>;
        } catch (error) {
            return Promise.reject(error);
        }
    };
};
