import type http from 'http';

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
 * http(s).request could have different arguments according to its types definition,
 * but we only care when second argument (url) is object containing RequestOptions.
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

    const isOverloadableUrl = typeof url === 'object' && 'headers' in url;
    const isOverloadableOptions = !options || typeof options === 'function';

    if (
        !!callback ||
        !isOverloadableUrl ||
        !isOverloadableOptions ||
        isWhitelistedHost(hostname, context.notRequiredTorDomainsList)
    ) {
        return;
    }

    const overloadedOptions = url;
    const overloadedCallback = options;
    const { host, path } = overloadedOptions;

    let identity: string | undefined;

    if (context.getTorSettings().running) {
        identity = assignTorAgent({ context, options: overloadedOptions, protocol });
    } else if (getIsTorRequired(url)) {
        enforceTorRequirement(context, host);
    }

    reportInterceptedRequest(context, `${host}${path} with agent ${!!overloadedOptions.agent}`);

    delete overloadedOptions.headers?.['Proxy-Authorization'];

    // Tuple of params for the original request.
    return [identity, overloadedOptions, overloadedCallback] as const;
};
