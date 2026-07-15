import type http from 'http';

import { getWeakRandomId, isWhitelistedHost } from '@trezor/utils';

import { type InterceptorContext } from './interceptorTypes';

const PROXY_AUTH_KEY = 'proxy-authorization';

const getHeaderValue = (headers: http.OutgoingHttpHeaders | undefined, name: string) => {
    if (!headers) return;

    const normalizedName = name.toLowerCase();
    const key = Object.keys(headers).find(k => k.toLowerCase() === normalizedName);
    if (!key) return;

    const value = headers[key];
    if (value === undefined) return;

    return { key, value };
};

const getIdentityName = (proxyAuthorization?: http.OutgoingHttpHeader) => {
    const identity = Array.isArray(proxyAuthorization) ? proxyAuthorization[0] : proxyAuthorization;

    // Only return identity name if it is explicitly defined.
    return typeof identity === 'string' ? identity.match(/Basic (.*)/)?.[1] : undefined;
};

/** Should the request be blocked if Tor isn't enabled? */
export const getIsTorRequired = (options?: Readonly<http.RequestOptions>) =>
    !!getHeaderValue(options?.headers, PROXY_AUTH_KEY)?.value;

const getIdentityForAgent = (options?: Readonly<http.RequestOptions>) => {
    const proxyAuthorization = getHeaderValue(options?.headers, PROXY_AUTH_KEY)?.value;
    if (proxyAuthorization) {
        // Use Proxy-Authorization header to define proxy identity
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Proxy-Authorization
        return getIdentityName(proxyAuthorization);
    }
    if (options?.headers?.Upgrade === 'websocket') {
        // Create random identity for each websocket connection
        return `WebSocket/${options.host}/${getWeakRandomId(16)}`;
    }
};

type RequestCallback = (response: http.IncomingMessage) => void;

type OverloadHttpRequestParams = {
    context: InterceptorContext;
    protocol: 'http' | 'https';
    url: string | URL | http.RequestOptions;
    options?: http.RequestOptions | RequestCallback;
    callback?: unknown;
    validateRequest: (params: { hostname: string }) => void;
};

const resolveHostname = (url: string | URL | http.RequestOptions) => {
    if (typeof url !== 'string') {
        return url.hostname ?? url.host ?? '';
    }

    return new URL(url).hostname;
};

const isRequestOptions = (
    value: string | URL | http.RequestOptions | RequestCallback | undefined,
): value is http.RequestOptions =>
    typeof value === 'object' && value !== null && !(value instanceof URL);

type ParsedRequestArgs = {
    requestUrl?: string | URL;
    requestOptions: http.RequestOptions;
    requestCallback?: RequestCallback;
};

/**
 * http(s).request supports several call signatures:
 *   1. request(options[, callback])
 *   2. request(url[, callback])
 *   3. request(url, options[, callback])
 *
 * They are normalized into a single mutable RequestOptions object (creating an empty one when
 * the call only carried a url) plus the optional url and callback, so the same Tor/proxy logic
 * can be applied regardless of how the request was originally called.
 */
const parseRequestArgs = ({
    url,
    options,
    callback,
}: Pick<OverloadHttpRequestParams, 'url' | 'options' | 'callback'>): ParsedRequestArgs => {
    // Signature 1: request(options[, callback])
    if (isRequestOptions(url)) {
        return {
            requestOptions: url,
            requestCallback: typeof options === 'function' ? options : undefined,
        };
    }

    // Signature 3: request(url, options[, callback])
    if (isRequestOptions(options)) {
        return {
            requestUrl: url,
            requestOptions: options,
            requestCallback:
                typeof callback === 'function' ? (callback as RequestCallback) : undefined,
        };
    }

    // Signature 2: request(url[, callback])
    return {
        requestUrl: url,
        requestOptions: {},
        requestCallback: typeof options === 'function' ? options : undefined,
    };
};

const reportInterceptedRequest = (context: InterceptorContext, details: string) => {
    context.handler({ type: 'INTERCEPTED_REQUEST', method: 'http.request', details });
};

/**
 * Assigns a Tor proxy agent to the request and returns the identity used for it.
 * The identity comes from the Proxy-Authorization header or falls back to 'default'.
 */
const assignTorAgent = ({
    context,
    options,
    protocol,
}: {
    context: InterceptorContext;
    options: http.RequestOptions;
    protocol: 'http' | 'https';
}) => {
    const identity = getIdentityForAgent(options) || 'default';

    options.agent = context.torIdentities.getIdentity(identity, options.timeout, protocol);

    return identity;
};

/**
 * Handles a request that explicitly requires Tor (via Proxy-Authorization) while Tor is off.
 * It is either conditionally allowed or blocked by throwing.
 */
const enforceTorRequirement = (context: InterceptorContext, host?: string | null) => {
    if (context.allowTorBypass) {
        reportInterceptedRequest(
            context,
            `Conditionally allowed request with Proxy-Authorization ${host}`,
        );

        return;
    }

    reportInterceptedRequest(context, `Request blocked ${host}`);
    throw new Error('Blocked request with Proxy-Authorization. TOR not enabled.');
};

/**
 * Intercepts http(s).request regardless of which of its call signatures was used and, for
 * non-whitelisted hosts, routes the request through the appropriate Tor identity (or blocks it
 * when Tor is required but disabled). Returns the reconstructed params for the original request,
 * preserving the original call signature, or `undefined` when the request is left untouched.
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

    if (isWhitelistedHost(hostname, context.notRequiredTorDomainsList)) {
        return;
    }

    const { requestUrl, requestOptions, requestCallback } = parseRequestArgs({
        url,
        options,
        callback,
    });

    let identity: string | undefined;

    if (context.getTorSettings().running) {
        identity = assignTorAgent({ context, options: requestOptions, protocol });
    } else if (getIsTorRequired(requestOptions)) {
        enforceTorRequirement(context, requestOptions.host ?? hostname);
    }

    const target = requestUrl ?? `${requestOptions.host ?? ''}${requestOptions.path ?? ''}`;
    reportInterceptedRequest(context, `${target} with agent ${!!requestOptions.agent}`);

    if (requestOptions.headers) {
        const proxyAuthKey = getHeaderValue(requestOptions.headers, PROXY_AUTH_KEY)?.key;
        if (proxyAuthKey) {
            delete requestOptions.headers[proxyAuthKey];
        }
    }

    // Params for the original request, preserving the original call signature.
    const requestArgs: Array<string | URL | http.RequestOptions | RequestCallback | undefined> =
        requestUrl !== undefined
            ? [requestUrl, requestOptions, requestCallback]
            : [requestOptions, requestCallback];

    return { identity, requestArgs };
};
