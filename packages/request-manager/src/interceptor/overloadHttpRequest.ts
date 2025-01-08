import http from 'http';

import { getWeakRandomId } from '@trezor/utils';

import { InterceptorContext, isWhitelistedHost } from './interceptorTypesAndUtils';

const getIdentityName = (proxyAuthorization?: http.OutgoingHttpHeader) => {
    const identity = Array.isArray(proxyAuthorization) ? proxyAuthorization[0] : proxyAuthorization;

    // Only return identity name if it is explicitly defined.
    return typeof identity === 'string' ? identity.match(/Basic (.*)/)?.[1] : undefined;
};

/** Should the request be blocked if Tor isn't enabled? */
const getIsTorRequired = (options: Readonly<http.RequestOptions>) =>
    !!options.headers?.['Proxy-Authorization'];

const getIdentityForAgent = (options: Readonly<http.RequestOptions>) => {
    if (options.headers?.['Proxy-Authorization']) {
        // Use Proxy-Authorization header to define proxy identity
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Proxy-Authorization
        return getIdentityName(options.headers['Proxy-Authorization']);
    }
    if (options.headers?.Upgrade === 'websocket') {
        // Create random identity for each websocket connection
        return `WebSocket/${options.host}/${getWeakRandomId(16)}`;
    }
};

/**
 * http(s).request could have different arguments according to its types definition,
 * but we only care when second argument (url) is object containing RequestOptions.
 */
export const overloadHttpRequest = (
    context: InterceptorContext,
    protocol: 'http' | 'https',
    url: string | URL | http.RequestOptions,
    options?: http.RequestOptions | ((r: http.IncomingMessage) => void),
    callback?: unknown,
) => {
    if (
        !callback &&
        typeof url === 'object' &&
        'headers' in url &&
        !isWhitelistedHost(url.hostname, context.notRequiredTorDomainsList) &&
        (!options || typeof options === 'function')
    ) {
        const isTorEnabled = context.getTorSettings().running;
        const isTorRequired = getIsTorRequired(url);
        const overloadedOptions = url;
        const overloadedCallback = options;
        const { host, path } = overloadedOptions;
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

        // return tuple of params for original request
        return [identity, overloadedOptions, overloadedCallback] as const;
    }
};
