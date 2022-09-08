import net from 'net';
import http from 'http';
import https from 'https';
import tls from 'tls';
import { InterceptedEvent } from './types';

type Listener = (event: InterceptedEvent) => void;

const interceptNetSocketConnect = (listener: Listener) => {
    const originalSocketConnect = net.Socket.prototype.connect;

    net.Socket.prototype.connect = function (...args) {
        const [options, connectionListener] = args as any;
        let details;
        if (Array.isArray(options) && options.length > 0 && options[0].href) {
            // When websockets in clearnet options contains array where first element is networkOptions.
            details = options[0].href;
        } else if (typeof options === 'object' && options.host && options.port) {
            // When Tor is used options is object with host and port that is used to connect to SocksPort.
            details = `${options.host}:${options.port}`;
        } else if (typeof options === 'number') {
            // When stablishing conneciton to Tor control port `connectionListener` is Tor control port and
            // `options` is Tor control port host, most likely 127.0.0.1.
            details = `${connectionListener}:${options}`;
        }

        listener({
            method: 'net.Socket.connect',
            details,
        });
        // @ts-expect-error
        return originalSocketConnect.apply(this, args);
    };
};

const interceptNetConnect = (listener: Listener) => {
    const originalConnect = net.connect;

    net.connect = function (...args) {
        const [connectArguments] = args;
        listener({ method: 'net.connect', details: (connectArguments as any).host });
        // @ts-expect-error
        return originalConnect.apply(this, args);
    };
};

const interceptHttp = (listener: Listener) => {
    const originalHttpRequest = http.request;

    http.request = function (...args) {
        const [options] = args as any;
        listener({ method: 'http.request', details: options.href });
        // @ts-expect-error
        return originalHttpRequest.apply(this, args);
    };
};

const interceptHttps = (listener: Listener) => {
    const originalHttpsRequest = https.request;

    https.request = function (...args) {
        const [options] = args as any;
        listener({ method: 'https.request', details: options.href });
        // @ts-expect-error
        return originalHttpsRequest.apply(this, args);
    };
};

const interceptTlsConnect = (listener: Listener) => {
    const orginalTlsConnect = tls.connect;

    tls.connect = function (...args) {
        const [options] = args as any;
        listener({ method: 'tls.connect', details: options.servername });
        // @ts-expect-error
        return orginalTlsConnect.apply(this, args);
    };
};

export const createInterceptor = (listener: Listener) => {
    interceptNetSocketConnect(listener);
    interceptNetConnect(listener);
    interceptHttp(listener);
    interceptHttps(listener);
    interceptTlsConnect(listener);
};
