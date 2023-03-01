import net from 'net';
import http from 'http';
import https from 'https';
import tls from 'tls';
import { getWeakRandomId } from '@trezor/utils';
import { TorIdentities } from './torIdentities';
import { InterceptorOptions } from './types';
import { RequestPool } from './httpPool';

const getIdentityName = (proxyAuthorization?: http.OutgoingHttpHeader) => {
    const identity = Array.isArray(proxyAuthorization) ? proxyAuthorization[0] : proxyAuthorization;
    // Only return identity name if it is explicitly defined.
    return typeof identity === 'string' ? identity.match(/Basic (.*)/)?.[1] : undefined;
};

/** Must be called only when Tor is enabled, throws otherwise */
const getAgent = (identityName?: string, timeout?: number, protocol?: 'http' | 'https') => {
    const agent = TorIdentities.getIdentity(identityName || 'default', timeout);

    // @sentry/node (used in suite-desktop) is wrapping each outgoing request
    // and requires protocol to be explicitly set to https while using TOR + https/wss address combination
    if (protocol) agent.protocol = `${protocol}:`;

    return agent;
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

const isLocalhost = (hostname?: string | null | undefined) =>
    typeof hostname === 'string' && ['127.0.0.1', 'localhost'].includes(hostname);

const interceptNetSocketConnect = (interceptorOptions: InterceptorOptions) => {
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

        interceptorOptions.handler({
            type: 'INTERCEPTED_REQUEST',
            method: 'net.Socket.connect',
            details,
        });
        // @ts-expect-error
        return originalSocketConnect.apply(this, args);
    };
};

const interceptNetConnect = (interceptorOptions: InterceptorOptions) => {
    const originalConnect = net.connect;

    net.connect = function (...args) {
        const [connectArguments] = args;
        interceptorOptions.handler({
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
    interceptorOptions: InterceptorOptions,
    protocol: 'http' | 'https',
    url: string | URL | http.RequestOptions,
    options?: http.RequestOptions | ((r: http.IncomingMessage) => void),
    callback?: unknown,
) => {
    if (
        !callback &&
        typeof url === 'object' &&
        'headers' in url &&
        !isLocalhost(url.hostname) &&
        (!options || typeof options === 'function')
    ) {
        const isTorEnabled = interceptorOptions.getIsTorEnabled();
        const isTorRequired = getIsTorRequired(url);
        const overloadedOptions = url;
        const overloadedCallback = options;
        // @ts-expect-error href does exist
        const requestedUrl = overloadedOptions.href || overloadedOptions.host;

        if (isTorEnabled) {
            // Create proxy agent for the request (from Proxy-Authorization or default)
            // get authorization data from request headers
            const identity = getIdentityForAgent(overloadedOptions);
            overloadedOptions.agent = getAgent(identity, overloadedOptions.timeout, protocol);
        } else if (isTorRequired) {
            // Block requests that explicitly requires TOR using Proxy-Authorization
            if (interceptorOptions.isDevEnv) {
                interceptorOptions.handler({
                    type: 'INTERCEPTED_REQUEST',
                    method: 'http.request',
                    details: `Conditionally allowed request with Proxy-Authorization ${requestedUrl}`,
                });
            } else {
                interceptorOptions.handler({
                    type: 'INTERCEPTED_REQUEST',
                    method: 'http.request',
                    details: `Request blocked ${requestedUrl}`,
                });
                throw new Error('Blocked request with Proxy-Authorization. TOR not enabled.');
            }
        }

        interceptorOptions.handler({
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
    interceptorOptions: InterceptorOptions,
    protocol: 'http' | 'https',
    url: string | URL | http.RequestOptions,
    options?: http.RequestOptions | ((r: http.IncomingMessage) => void),
    callback?: unknown,
) => {
    if (
        typeof url === 'object' &&
        !isLocalhost(url.host) && // difference between overloadHttpRequest
        'headers' in url &&
        url.headers?.Upgrade === 'websocket'
    ) {
        return overloadHttpRequest(interceptorOptions, protocol, url, options, callback);
    }
};

const interceptHttp = (interceptorOptions: InterceptorOptions, requestPool: RequestPool) => {
    const originalHttpRequest = http.request;

    http.request = (...args) => {
        const overload = overloadHttpRequest(interceptorOptions, 'http', ...args);
        if (overload) {
            const request = originalHttpRequest(...overload);
            requestPool.addRequest(request);
            return request;
        }

        // In cases that are not considered above we pass the args as they came.
        return originalHttpRequest(...(args as Parameters<typeof http.request>));
    };

    const originalHttpGet = http.get;

    http.get = (...args) => {
        const overload = overloadWebsocketHandshake(interceptorOptions, 'http', ...args);
        if (overload) {
            return originalHttpGet(...overload);
        }
        return originalHttpGet(...(args as Parameters<typeof https.get>));
    };
};

const interceptHttps = (interceptorOptions: InterceptorOptions, requestPool: RequestPool) => {
    const originalHttpsRequest = https.request;

    https.request = (...args) => {
        const overload = overloadHttpRequest(interceptorOptions, 'https', ...args);
        if (overload) {
            const request = originalHttpsRequest(...overload);
            requestPool.addRequest(request);
            return request;
        }

        // In cases that are not considered above we pass the args as they came.
        return originalHttpsRequest(...(args as Parameters<typeof https.request>));
    };

    const originalHttpsGet = https.get;

    https.get = (...args) => {
        const overload = overloadWebsocketHandshake(interceptorOptions, 'https', ...args);
        if (overload) {
            return originalHttpsGet(...overload);
        }
        return originalHttpsGet(...(args as Parameters<typeof https.get>));
    };
};

const interceptTlsConnect = (interceptorOptions: InterceptorOptions) => {
    const originalTlsConnect = tls.connect;

    tls.connect = function (...args) {
        const [options] = args as any;
        interceptorOptions.handler({
            type: 'INTERCEPTED_REQUEST',
            method: 'tls.connect',
            details: options.servername,
        });
        // @ts-expect-error
        return originalTlsConnect.apply(this, args);
    };
};

export const createInterceptor = (interceptorOptions: InterceptorOptions) => {
    const requestPool = new RequestPool(interceptorOptions);
    interceptNetSocketConnect(interceptorOptions);
    interceptNetConnect(interceptorOptions);
    interceptHttp(interceptorOptions, requestPool);
    interceptHttps(interceptorOptions, requestPool);
    interceptTlsConnect(interceptorOptions);

    return { requestPool };
};
