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
        // Native `fetch` never throws synchronously — it always returns a (possibly rejected)
        // promise. `resolveHostname`/`getHeaderValue` and `validateRequest` can throw on a malformed
        // url/headers or a blocked host, so the whole body is guarded to preserve that contract.
        try {
            const isTorEnabled = context.getTorSettings().running;
            const proxyAuthorization = getHeaderValue(options?.headers, 'Proxy-Authorization');
            const isTorRequired = proxyAuthorization !== undefined;

            const hostname = resolveHostname(url);
            validateRequest({ hostname });

            // Hosts that don't require Tor (e.g. localhost, dev domains) connect directly. The
            // whitelist is checked BEFORE the Tor-required block so its ordering matches the http(s)
            // interceptor in `overloadHttpRequest` (there a whitelisted host returns untouched
            // before `enforceTorRequirement`): a whitelisted host is allowed even when it carries a
            // Proxy-Authorization header while Tor is off.
            if (isWhitelistedHost(hostname, context.notRequiredTorDomainsList)) {
                return originalFetch(url, options);
            }

            if (!isTorEnabled) {
                if (isTorRequired && !context.allowTorBypass) {
                    return Promise.reject(
                        new Error('Blocked request with Proxy-Authorization. TOR not enabled.'),
                    );
                }

                return originalFetch(url, options);
            }

            // Use the Proxy-Authorization header to select the Tor circuit, falling back to 'default'.
            const identity = getIdentityName(proxyAuthorization) || 'default';
            const dispatcher = context.torIdentities.getDispatcher(identity);
            const headers = buildTorHeaders(options?.headers);

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
                        ...options,
                        headers,
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
