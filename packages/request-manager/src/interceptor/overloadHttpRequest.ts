import type http from 'http';
import { urlToHttpOptions } from 'url';

import { getWeakRandomId, isWhitelistedHost } from '@trezor/utils';

import { type InterceptorContext } from './interceptorTypes';

const getIdentityName = (proxyAuthorization?: http.OutgoingHttpHeader) => {
    const identity = Array.isArray(proxyAuthorization) ? proxyAuthorization[0] : proxyAuthorization;

    // Only return identity name if it is explicitly defined.
    return typeof identity === 'string' ? identity.match(/Basic (.*)/)?.[1] : undefined;
};

/** Should the request be blocked if Tor isn't enabled? */
export const getIsTorRequired = (options?: Readonly<http.RequestOptions>) =>
    !!options?.headers?.['Proxy-Authorization'];

const getIdentityForAgent = (options?: Readonly<http.RequestOptions>) => {
    if (options?.headers?.['Proxy-Authorization']) {
        // Use Proxy-Authorization header to define proxy identity
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Proxy-Authorization
        return getIdentityName(options.headers['Proxy-Authorization']);
    }
    if (options?.headers?.Upgrade === 'websocket') {
        // Create random identity for each websocket connection
        return `WebSocket/${options.host}/${getWeakRandomId(16)}`;
    }
};

type OverloadHttpRequestParams = {
    context: InterceptorContext;
    protocol: 'http' | 'https';
    url: string | URL | http.RequestOptions;
    options?: http.RequestOptions | ((r: http.IncomingMessage) => void);
    callback?: unknown;
    validateRequest: (params: { hostname: string }) => void;
};

const resolveHostname = (url: string | URL | http.RequestOptions) => {
    if (typeof url !== 'string') {
        return url.hostname ?? url.host ?? '';
    }

    return new URL(url).hostname;
};

const getOptionsFromUrl = (url: string | URL) => {
    const normalizedUrl = typeof url === 'string' ? new URL(url) : url;

    return urlToHttpOptions(normalizedUrl);
};

/**
 * http(s).request supports several call signatures:
 *   1. request(options[, callback])
 *   2. request(url[, callback])
 *   3. request(url, options[, callback])
 *
 * We need to attach the Tor agent (or apply Proxy-Authorization rules) to the
 * RequestOptions object regardless of how the caller invoked the function.
 *
 * Historically only signature 1 was handled, which broke when libraries like
 * `node-fetch@3` started using signature 3 (`request(urlString, options)`),
 * because the function returned early without attaching the Tor agent and the
 * request silently bypassed Tor.
 */
export const overloadHttpRequest = ({
    context,
    protocol,
    url,
    options,
    callback,
    validateRequest,
}: OverloadHttpRequestParams) => {
    const hostname = resolveHostname(url);

    validateRequest({ hostname });

    // Resolve which argument is the RequestOptions object (the one we need to
    // mutate to attach the Tor agent / inspect for Proxy-Authorization).
    let overloadedUrl: string | URL | undefined;
    let overloadedOptions: http.RequestOptions | undefined;
    let overloadedCallback: unknown;

    if (
        typeof url === 'object' &&
        url !== null &&
        !(url instanceof URL) &&
        'headers' in url &&
        (!options || typeof options === 'function')
    ) {
        // signature 1: request(options[, callback])
        overloadedOptions = url;
        overloadedCallback = options;
    } else if (
        (typeof url === 'string' || url instanceof URL) &&
        (!options || typeof options === 'function')
    ) {
        // signature 2: request(url[, callback])
        overloadedUrl = url;
        overloadedOptions = getOptionsFromUrl(url);
        overloadedCallback = options;
    } else if (
        (typeof url === 'string' || url instanceof URL) &&
        typeof options === 'object' &&
        options !== null &&
        'headers' in options
    ) {
        // signature 3: request(url, options[, callback])
        overloadedUrl = url;
        overloadedOptions = options;
        overloadedCallback = callback;
    }

    if (!overloadedOptions || isWhitelistedHost(hostname, context.notRequiredTorDomainsList)) {
        return;
    }

    const isTorEnabled = context.getTorSettings().running;
    const isTorRequired = getIsTorRequired(overloadedOptions);
    // Fall back to the resolved hostname when the caller passed the URL as the
    // first argument (in that case `options.host` is typically not set).
    const host = overloadedOptions.host ?? hostname;
    const path = overloadedOptions.path ?? '';
    let identity: string | undefined;

    if (isTorEnabled) {
        // Create proxy agent for the request (from Proxy-Authorization or default)
        // get authorization data from request headers
        identity = getIdentityForAgent(overloadedOptions) || 'default';
        overloadedOptions.agent = context.torIdentities.getIdentity(
            identity,
            overloadedOptions.timeout,
            protocol,
        );
    } else if (isTorRequired) {
        // Block requests that explicitly requires TOR using Proxy-Authorization
        if (context.allowTorBypass) {
            context.handler({
                type: 'INTERCEPTED_REQUEST',
                method: 'http.request',
                details: `Conditionally allowed request with Proxy-Authorization ${host}`,
            });
        } else {
            context.handler({
                type: 'INTERCEPTED_REQUEST',
                method: 'http.request',
                details: `Request blocked ${host}`,
            });
            throw new Error('Blocked request with Proxy-Authorization. TOR not enabled.');
        }
    }

    context.handler({
        type: 'INTERCEPTED_REQUEST',
        method: 'http.request',
        details: `${host}${path} with agent ${!!overloadedOptions.agent}`,
    });

    delete overloadedOptions.headers?.['Proxy-Authorization'];

    // Return a tuple of params matching the original call signature so that
    // `originalRequest(...overloadedArgs)` preserves the caller's intent.
    if (overloadedUrl !== undefined) {
        return [identity, overloadedUrl, overloadedOptions, overloadedCallback] as const;
    }

    return [identity, overloadedOptions, overloadedCallback] as const;
};
