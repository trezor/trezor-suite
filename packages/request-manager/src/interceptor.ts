import net from 'net';
import http from 'http';
import https from 'https';
import tls from 'tls';
import { InterceptedEvent } from './types';

type Listener = (event: InterceptedEvent) => void;

const interceptNetSocketConnect = (listener: Listener) => {
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
            // When stablishing conneciton to Tor control port `connectionListener` is Tor control port and
            // `options` is Tor control port host, most likely 127.0.0.1.
            details = `${connectionListener}:${options}`;
        }

        listener({
            method: 'net.Socket.connect',
            details,
        });
        return originalSocketConnect.call(this, options, connectionListener);
    };
};

const interceptNetConnect = (listener: Listener) => {
    const originalConnect = net.connect;
    net.connect = (connectArguments, connectionListener) => {
        listener({ method: 'net.connect', details: (connectArguments as any).host });
        return originalConnect.call(this, connectArguments as any, connectionListener as any);
    };
};

const interceptHttp = (listener: Listener) => {
    const originalHttpRequest = http.request;

    http.request = function (options: any, callback) {
        listener({ method: 'http.request', details: options.href });
        return originalHttpRequest.call(this, options, callback as any);
    };
};

const interceptHttps = (listener: Listener) => {
    const originalHttpsRequest = https.request;
    https.request = function (options: any, callback) {
        listener({ method: 'https.request', details: options.href });
        return originalHttpsRequest.call(this, options, callback as any);
    };
};

const interceptTlsConnect = (listener: Listener) => {
    const orginalTlsConnect = tls.connect;

    tls.connect = function (options: any, secureConnectListener) {
        listener({ method: 'tls.connect', details: options.servername });
        return orginalTlsConnect.call(this, options as any, secureConnectListener as any);
    };
};

export const createInterceptor = (listener: Listener) => {
    interceptNetSocketConnect(listener);
    interceptNetConnect(listener);
    interceptHttp(listener);
    interceptHttps(listener);
    interceptTlsConnect(listener);
};
