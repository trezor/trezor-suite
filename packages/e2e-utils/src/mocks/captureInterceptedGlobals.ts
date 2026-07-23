import http from 'http';
import https from 'https';
import net from 'net';
import tls from 'tls';

// createInterceptor patches Node's networking globals (http/https request+get, net.connect,
// net.Socket.prototype connect+write, tls.connect, global.fetch, globalThis.WebSocket) in place
// and offers no uninstall. Call this before installing an interceptor and invoke the returned
// restore function in afterAll, so the interception cannot leak into other test files that share
// the same jest worker.
export const captureInterceptedGlobals = () => {
    const originals = {
        httpRequest: http.request,
        httpGet: http.get,
        httpsRequest: https.request,
        httpsGet: https.get,
        netConnect: net.connect,
        socketConnect: net.Socket.prototype.connect,
        socketWrite: net.Socket.prototype.write,
        tlsConnect: tls.connect,
        fetch: global.fetch,
        webSocket: globalThis.WebSocket,
    };

    return () => {
        http.request = originals.httpRequest;
        http.get = originals.httpGet;
        https.request = originals.httpsRequest;
        https.get = originals.httpsGet;
        net.connect = originals.netConnect;
        net.Socket.prototype.connect = originals.socketConnect;
        net.Socket.prototype.write = originals.socketWrite;
        tls.connect = originals.tlsConnect;
        global.fetch = originals.fetch;
        globalThis.WebSocket = originals.webSocket;
    };
};
