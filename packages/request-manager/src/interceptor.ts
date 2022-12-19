import net from 'net';
import http from 'http';
import https from 'https';
import tls from 'tls';
import { TorIdentities } from './torIdentities';
import { InterceptorOptions } from './types';
import { RequestPool } from './httpPool';

const getIdentityName = (proxyAuthorization?: http.OutgoingHttpHeader) => {
    let identity;
    if (Array.isArray(proxyAuthorization)) {
        [identity] = proxyAuthorization;
    }
    if (typeof proxyAuthorization === 'string') {
        identity = proxyAuthorization;
    }
    if (identity) {
        const identityName = identity.match(/Basic (.*)/);
        // Only return identity name if it is explicitly defined.
        return identityName ? identityName[1] : undefined;
    }
    return undefined;
};

const getAgent = (identityName?: string, timeout?: number) =>
    TorIdentities.getIdentity(identityName || 'default', timeout);

const getAuthorizationOptions = (options: http.RequestOptions) => {
    // Use Proxy-Authorization header to define proxy identity
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Proxy-Authorization
    if (options.headers && options.headers['Proxy-Authorization']) {
        const identityName = getIdentityName(options.headers['Proxy-Authorization']);
        // In the case that `Proxy-Authorization` was used for identity information we remove it.
        delete options.headers['Proxy-Authorization'];
        // Create proxy agent for the request
        options.agent = getAgent(identityName, options.timeout);
    }
    return options;
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
        // get authorization data from request headers
        const overloadedOptions = getAuthorizationOptions(url);
        const overloadedCallback = options;
        // @ts-expect-error href does exist
        const requestedUrl = overloadedOptions.href;

        // block requests that explicitly requires TOR using Proxy-Authorization
        if (!isTorEnabled && overloadedOptions.agent) {
            if (interceptorOptions.isDevEnv) {
                interceptorOptions.handler({
                    type: 'INTERCEPTED_REQUEST',
                    method: 'http.request',
                    details: `Conditionally allowed request with Proxy-Authorization ${requestedUrl}`,
                });
                // conditionally allow in dev mode
                delete overloadedOptions.agent;
            } else {
                interceptorOptions.handler({
                    type: 'INTERCEPTED_REQUEST',
                    method: 'http.request',
                    details: `Request blocked ${requestedUrl}`,
                });
                throw new Error('Blocked request with Proxy-Authorization. TOR not enabled.');
            }
        }

        // add default proxy agent
        if (isTorEnabled && !overloadedOptions.agent) {
            overloadedOptions.agent = getAgent('default', overloadedOptions.timeout);
        }

        interceptorOptions.handler({
            type: 'INTERCEPTED_REQUEST',
            method: 'http.request',
            details: `${requestedUrl} with agent ${!!overloadedOptions.agent}`,
        });

        // return tuple of params for original request
        return [overloadedOptions, overloadedCallback] as const;
    }
};

const interceptHttp = (interceptorOptions: InterceptorOptions, requestPool: any) => {
    const originalHttpRequest = http.request;

    http.request = (...args) => {
        const overload = overloadHttpRequest(interceptorOptions, ...args);
        if (overload) {
            const request = originalHttpRequest(...overload);
            requestPool.addRequest(request);
            return request;
        }

        // In cases that are not considered above we pass the args as they came.
        return originalHttpRequest(...(args as Parameters<typeof http.request>));
    };
};

const interceptHttps = (interceptorOptions: InterceptorOptions, requestPool: any) => {
    const originalHttpsRequest = https.request;

    https.request = (...args) => {
        const overload = overloadHttpRequest(interceptorOptions, ...args);
        if (overload) {
            const request = originalHttpsRequest(...overload);
            requestPool.addRequest(request);
            return request;
        }

        // In cases that are not considered above we pass the args as they came.
        return originalHttpsRequest(...(args as Parameters<typeof https.request>));
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
