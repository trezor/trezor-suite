import net from 'net';
import http from 'http';
import https from 'https';
import tls from 'tls';
import { InterceptedEvent } from './types';
import { TorIdentities } from './torIdentities';

type InterceptorOptions = {
    handler: (event: InterceptedEvent) => void;
    getIsTorEnabled: () => boolean;
};

const getIdentityName = (userAgent: string): string | undefined => {
    const identity = userAgent[0];
    if (Array.isArray(userAgent)) {
        const identityName = identity.match(/identity:(.*)/);
        // Only return identity name if it is explicitly defined.
        return identityName ? identityName[1] : undefined;
    }
    return undefined;
};

const getAgent = (identityName: string | undefined) =>
    TorIdentities.getIdentity(identityName || 'default');

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
            method: 'net.connect',
            details: (connectArguments as any).host,
        });

        // @ts-expect-error
        return originalConnect.apply(this, args);
    };
};

const interceptHttp = (interceptorOptions: InterceptorOptions) => {
    const originalHttpRequest = http.request;

    http.request = function (...args) {
        const isTorEnabled = interceptorOptions.getIsTorEnabled();
        // eslint-disable-next-line prefer-const
        let [url, options, callback] = args as any;
        // http.request could have different arguments according to it's types definition,
        // but we only care when second argument is object containing RequestOptions.
        if (!callback && typeof url === 'object' && (!options || typeof options === 'function')) {
            const overloadedOptions = url;
            const overloadedCallback = options;

            const overloadedOptionsUrl = new URL(overloadedOptions.href);
            const userAgent = overloadedOptions.headers['User-Agent'];
            // Requests to localhost should not use the proxy.
            const shouldIntercept = overloadedOptionsUrl.hostname !== '127.0.0.1';
            const identityName = getIdentityName(userAgent);
            const agent = isTorEnabled && shouldIntercept ? getAgent(identityName) : undefined;
            if (agent) {
                // In the case that `User-Agent` was used for identity information we send empty string.
                // TODO: this could be changed to use a common `User-Agent` instead of empty string,
                // but consider the common `User-Agent` will be changing over time.
                overloadedOptions.headers['User-Agent'] = '';
            }

            interceptorOptions.handler({ method: 'http.request', details: overloadedOptions.href });
            return originalHttpRequest.call(
                this,
                {
                    ...overloadedOptions,
                    agent,
                },
                overloadedCallback as any,
            );
        }

        // In cases that are not considered above we pass the args as they came.
        // @ts-expect-error
        return originalHttpRequest.apply(this, args);
    };
};

const interceptHttps = (interceptorOptions: InterceptorOptions) => {
    const originalHttpsRequest = https.request;

    https.request = function (...args) {
        const isTorEnabled = interceptorOptions.getIsTorEnabled();
        const [url, options, callback] = args as any;
        // https.request could have different arguments according to it's types definition,
        // but we only care when second argument is object containing RequestOptions.
        if (!callback && typeof url === 'object' && (!options || typeof options === 'function')) {
            const overloadedOptions = url;
            const overloadedCallback = options;

            const overloadedOptionsUrl = new URL(overloadedOptions.href);
            const userAgent = overloadedOptions.headers['User-Agent'];
            // Requests to localhost should not use the proxy.
            const shouldIntercept = overloadedOptionsUrl.hostname !== '127.0.0.1';
            const identityName = getIdentityName(userAgent);
            const agent = isTorEnabled && shouldIntercept ? getAgent(identityName) : undefined;
            if (agent) {
                // In the case that `User-Agent` was used for identity information we send empty string.
                // TODO: this could be changed to use a common `User-Agent` instead of empty string,
                // but consider the common `User-Agent` will be changing over time.
                overloadedOptions.headers['User-Agent'] = '';
            }

            interceptorOptions.handler({
                method: 'https.request',
                details: overloadedOptions.href,
            });

            return originalHttpsRequest.call(
                this,
                {
                    ...overloadedOptions,
                    agent,
                },
                overloadedCallback as any,
            );
        }

        // In cases that are not considered above we pass the args as they came.
        // @ts-expect-error
        return originalHttpsRequest.apply(this, args);
    };
};

const interceptTlsConnect = (interceptorOptions: InterceptorOptions) => {
    const originalTlsConnect = tls.connect;

    tls.connect = function (...args) {
        const [options] = args as any;
        interceptorOptions.handler({ method: 'tls.connect', details: options.servername });
        // @ts-expect-error
        return originalTlsConnect.apply(this, args);
    };
};

export const createInterceptor = (interceptorOptions: InterceptorOptions) => {
    interceptNetSocketConnect(interceptorOptions);
    interceptNetConnect(interceptorOptions);
    interceptHttp(interceptorOptions);
    interceptHttps(interceptorOptions);
    interceptTlsConnect(interceptorOptions);
};
