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

const getIdentityName = (userAgent: string) => {
    const identity = userAgent[0];
    if (Array.isArray(userAgent)) {
        const identityName = identity.match(/identity:(.*)/);
        // Only return identity name if it is explicitly defined.
        return identityName ? identityName[1] : undefined;
    }
    return undefined;
};

const getAgent = (options: any) => {
    const url = new URL(options.href);
    const userAgent = options.headers['User-Agent'];
    const identityName = getIdentityName(userAgent);
    const shouldIntercept = url.hostname !== '127.0.0.1';

    return shouldIntercept ? TorIdentities.getIdentity(identityName || 'default') : undefined;
};

const interceptNetSocketConnect = (interceptorOptions: InterceptorOptions) => {
    const originalSocketConnect = net.Socket.prototype.connect;

    net.Socket.prototype.connect = function (options: any, connectionListener: any) {
        let details;
        if (Array.isArray(options) && options.length > 0 && options[0].href) {
            // When websockets in clearnet options contains array where first element is networkOptions.
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
        return originalSocketConnect.call(this, options, connectionListener);
    };
};

const interceptNetConnect = (interceptorOptions: InterceptorOptions) => {
    const originalConnect = net.connect;
    net.connect = (connectArguments, connectionListener) => {
        interceptorOptions.handler({
            method: 'net.connect',
            details: (connectArguments as any).host,
        });
        return originalConnect.call(this, connectArguments as any, connectionListener as any);
    };
};

const interceptHttp = (interceptorOptions: InterceptorOptions) => {
    const originalHttpRequest = http.request;

    http.request = function (options: any, callback) {
        interceptorOptions.handler({ method: 'http.request', details: options.href });
        const isTorEnabled = interceptorOptions.getIsTorEnabled();
        const agent = isTorEnabled ? getAgent(options) : undefined;

        return originalHttpRequest.call(
            this,
            {
                ...options,
                agent,
            },
            callback as any,
        );
    };
};

const interceptHttps = (interceptorOptions: InterceptorOptions) => {
    const originalHttpsRequest = https.request;

    https.request = function (options: any, callback) {
        interceptorOptions.handler({ method: 'https.request', details: options.href });
        const isTorEnabled = interceptorOptions.getIsTorEnabled();
        const agent = isTorEnabled ? getAgent(options) : undefined;

        return originalHttpsRequest.call(
            this,
            {
                ...options,
                agent,
            },
            callback as any,
        );
    };
};

const interceptTlsConnect = (interceptorOptions: InterceptorOptions) => {
    const originalTlsConnect = tls.connect;

    tls.connect = function (options: any, secureConnectListener) {
        interceptorOptions.handler({ method: 'tls.connect', details: options.servername });
        return originalTlsConnect.call(this, options as any, secureConnectListener as any);
    };
};

export const createInterceptor = (interceptorOptions: InterceptorOptions) => {
    interceptNetSocketConnect(interceptorOptions);
    interceptNetConnect(interceptorOptions);
    interceptHttp(interceptorOptions);
    interceptHttps(interceptorOptions);
    interceptTlsConnect(interceptorOptions);
};
