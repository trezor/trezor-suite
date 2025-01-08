import net from 'net';

import { InterceptorContext } from './interceptorTypesAndUtils';

export const interceptNetSocketConnect = (context: InterceptorContext) => {
    // To avoid disclosure that the request was sent by trezor-suite
    // remove headers added by underlying libs before they are sent to the server.
    // 1. nodejs http always(!) adds "Connection: close" header
    //    https://github.com/nodejs/node/blob/e48763840625c037282681456ecd1e1cb034f636/lib/_http_outgoing.js#L508-L510
    // 2. node-fetch always(!) adds "User-Agent", "Accept", "Connection"...
    //    https://github.com/node-fetch/node-fetch/blob/7b86e946b02dfdd28f4f8fca3d73a022cbb5ca1e/src/request.js#L226
    const originalSocketWrite = net.Socket.prototype.write;
    net.Socket.prototype.write = function (data, ...args) {
        const overloadedHeaders: string[] = [];
        if (typeof data === 'string' && /Allowed-Headers/gi.test(data)) {
            const headers = data.split('\r\n');
            const allowedHeaders = headers
                .find(line => /^Allowed-Headers/i.test(line))
                ?.split(': ');

            if (allowedHeaders) {
                const allowedKeys = allowedHeaders[1].split(';');

                headers.forEach(line => {
                    const [key, value] = line.split(': ');
                    if (key && value) {
                        if (allowedKeys.some(allowed => new RegExp(`^${allowed}`, 'i').test(key))) {
                            overloadedHeaders.push(line);
                        }
                    } else {
                        overloadedHeaders.push(line);
                    }
                });

                context.handler({
                    type: 'INTERCEPTED_HEADERS',
                    method: 'net.Socket.write',
                    details: overloadedHeaders.join(' '),
                });
            }
        }

        return originalSocketWrite.apply(this, [
            overloadedHeaders.length > 0 ? overloadedHeaders.join('\r\n') : data,
            ...args,
        ] as unknown as Parameters<typeof originalSocketWrite>);
    };

    const originalSocketConnect = net.Socket.prototype.connect;

    net.Socket.prototype.connect = function (...args) {
        const [options, callback] = args;
        let request: typeof options;
        let details: string;
        if (Array.isArray(options)) {
            // Websocket in clear-net contains array where first element is SocketConnectOpts
            [request] = options;
        } else {
            request = options;
        }

        if (typeof request === 'object') {
            if ('port' in request) {
                // TcpSocketConnectOpts
                details = `${request.host}:${request.port}`;
            } else {
                // IpcSocketConnectOpts
                details = request.path;
            }
        } else if (typeof request === 'string') {
            details = request;
        } else {
            details = typeof callback === 'string' ? `${callback}:${request}` : request.toString();
        }

        context.handler({
            type: 'INTERCEPTED_REQUEST',
            method: 'net.Socket.connect',
            details,
        });

        return originalSocketConnect.apply(
            this,
            args as unknown as Parameters<typeof originalSocketConnect>,
        );
    };
};
