import net from 'net';
import http from 'http';
import https from 'https';
import tls from 'tls';
import { getWeakRandomId } from '@trezor/utils';
import { TorIdentities } from './torIdentities';
import { InterceptorOptions } from './types';
import { createRequestPool } from './httpPool';

type InterceptorContext = InterceptorOptions & {
    requestPool: ReturnType<typeof createRequestPool>;
    torIdentities: TorIdentities;
};

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

const isWhitelistedHost = (hostname: unknown, whitelist: string[] = ['127.0.0.1', 'localhost']) =>
    typeof hostname === 'string' &&
    whitelist.some(url => url === hostname || hostname.endsWith(url));

const interceptNetSocketConnect = (context: InterceptorContext) => {
    const originalSocketConnect = net.Socket.prototype.connect;

    net.Socket.prototype.connect = function (...args) {
        const [options, connectionListener] = args as any;
        let details;
        if (Array.isArray(options) && options.length > 0 && options[0].href) {
            // When websockets in clear-net options contains array where first element is networkOptions.
            details = options[0].href;
        } else if (typeof options === 'object' && options.host && options.port) {
            // When Tor is used options is object with host and port that is used to connect to SocksPort.
            details = `${options.host}:${options.port}`;
        } else if (typeof options === 'number') {
            // When establishing connection to Tor control port `connectionListener` is Tor control port and
            // `options` is Tor control port host, most likely 127.0.0.1.
            details = `${connectionListener}:${options}`;
        }

        context.handler({
            type: 'INTERCEPTED_REQUEST',
            method: 'net.Socket.connect',
            details,
        });
        // @ts-expect-error
        return originalSocketConnect.apply(this, args);
    };
};

const interceptNetConnect = (context: InterceptorContext) => {
    const originalConnect = net.connect;

    net.connect = function (...args) {
        const [connectArguments] = args;
        context.handler({
            type: 'INTERCEPTED_REQUEST',
            method: 'net.connect',
            details: (connectArguments as any).host,
        });

        // @ts-expect-error
        return originalConnect.apply(this, args);
    };
};

// http(s).request could have different arguments according to it's types definition,
// but we only care when second argument (url) is object containing RequestOptions.
const overloadHttpRequest = (
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
        !isWhitelistedHost(url.hostname, context.whitelistedHosts) &&
        (!options || typeof options === 'function')
    ) {
        const isTorEnabled = context.getTorSettings().running;
        const isTorRequired = getIsTorRequired(url);
        const overloadedOptions = url;
        const overloadedCallback = options;
        // @ts-expect-error href does exist
        const requestedUrl = overloadedOptions.href || overloadedOptions.host;

        if (isTorEnabled) {
            // Create proxy agent for the request (from Proxy-Authorization or default)
            // get authorization data from request headers
            const identity = getIdentityForAgent(overloadedOptions);
            overloadedOptions.agent = context.torIdentities.getIdentity(
                identity || 'default',
                overloadedOptions.timeout,
                protocol,
            );
        } else if (isTorRequired) {
            // Block requests that explicitly requires TOR using Proxy-Authorization
            if (context.allowTorBypass) {
                context.handler({
                    type: 'INTERCEPTED_REQUEST',
                    method: 'http.request',
                    details: `Conditionally allowed request with Proxy-Authorization ${requestedUrl}`,
                });
            } else {
                context.handler({
                    type: 'INTERCEPTED_REQUEST',
                    method: 'http.request',
                    details: `Request blocked ${requestedUrl}`,
                });
                throw new Error('Blocked request with Proxy-Authorization. TOR not enabled.');
            }
        }

        context.handler({
            type: 'INTERCEPTED_REQUEST',
            method: 'http.request',
            details: `${requestedUrl} with agent ${!!overloadedOptions.agent}`,
        });

        delete overloadedOptions.headers?.['Proxy-Authorization'];

        // return tuple of params for original request
        return [overloadedOptions, overloadedCallback] as const;
    }
};

const overloadWebsocketHandshake = (
    context: InterceptorContext,
    protocol: 'http' | 'https',
    url: string | URL | http.RequestOptions,
    options?: http.RequestOptions | ((r: http.IncomingMessage) => void),
    callback?: unknown,
) => {
    // @trezor/blockchain-link is adding an SocksProxyAgent to each connection
    // related to https://github.com/trezor/trezor-suite/issues/7689
    // this condition should be removed once suite will stop using TrezorConnect.setProxy
    if (
        typeof url === 'object' &&
        isWhitelistedHost(url.host, context.whitelistedHosts) &&
        'agent' in url
    ) {
        delete url.agent;
    }
    if (
        typeof url === 'object' &&
        !isWhitelistedHost(url.host, context.whitelistedHosts) && // difference between overloadHttpRequest
        'headers' in url &&
        url.headers?.Upgrade === 'websocket'
    ) {
        return overloadHttpRequest(context, protocol, url, options, callback);
    }
};

const interceptHttp = (context: InterceptorContext) => {
    const originalHttpRequest = http.request;

    http.request = (...args) => {
        const overload = overloadHttpRequest(context, 'http', ...args);
        if (overload) {
            return context.requestPool(originalHttpRequest(...overload));
        }

        // In cases that are not considered above we pass the args as they came.
        return originalHttpRequest(...(args as Parameters<typeof http.request>));
    };

    const originalHttpGet = http.get;

    http.get = (...args) => {
        const overload = overloadWebsocketHandshake(context, 'http', ...args);
        if (overload) {
            return context.requestPool(originalHttpGet(...overload));
        }
        return originalHttpGet(...(args as Parameters<typeof https.get>));
    };
};

const interceptHttps = (context: InterceptorContext) => {
    const originalHttpsRequest = https.request;

    https.request = (...args) => {
        const overload = overloadHttpRequest(context, 'https', ...args);
        if (overload) {
            return context.requestPool(originalHttpsRequest(...overload));
        }

        // In cases that are not considered above we pass the args as they came.
        return originalHttpsRequest(...(args as Parameters<typeof https.request>));
    };

    const originalHttpsGet = https.get;

    https.get = (...args) => {
        const overload = overloadWebsocketHandshake(context, 'https', ...args);
        if (overload) {
            return context.requestPool(originalHttpsGet(...overload));
        }
        return originalHttpsGet(...(args as Parameters<typeof https.get>));
    };
};

const interceptTlsConnect = (context: InterceptorContext) => {
    const originalTlsConnect = tls.connect;

    tls.connect = (...args) => {
        const [options] = args;
        if (typeof options === 'object') {
            context.handler({
                type: 'INTERCEPTED_REQUEST',
                method: 'tls.connect',
                details: options.host || options.servername || 'unknown',
            });

            // allow untrusted/self-signed certificates for whitelisted domains (like https://*.sldev.cz)
            options.rejectUnauthorized =
                options.rejectUnauthorized ??
                !isWhitelistedHost(options.host, context.whitelistedHosts);
        }
        return originalTlsConnect(...(args as Parameters<typeof tls.connect>));
    };
};

export const createInterceptor = (interceptorOptions: InterceptorOptions) => {
    const requestPool = createRequestPool(interceptorOptions);
    const torIdentities = new TorIdentities(interceptorOptions.getTorSettings);
    const context = { ...interceptorOptions, requestPool, torIdentities };

    interceptNetSocketConnect(context);
    interceptNetConnect(context);
    interceptHttp(context);
    interceptHttps(context);
    interceptTlsConnect(context);

    return { requestPool, torIdentities };
};
