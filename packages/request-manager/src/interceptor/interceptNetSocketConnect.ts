import net from 'net';
import { SocksClient } from 'socks';

import { isWhitelistedHost } from '@trezor/utils';

import { type Interceptor } from './interceptorTypes';

export const interceptNetSocketConnect: Interceptor = ({ context, validateRequest }) => {
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
                const allowedValue = allowedHeaders[1] ?? '';
                const allowedKeys = allowedValue.split(';');

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

    const parseTcpConnectArgs = (
        args: unknown[],
    ): { host: string; port: number; callback?: () => void } | undefined => {
        const [options, callbackOrHost] = args;

        if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
            if ('port' in options) {
                const opts = options as net.TcpSocketConnectOpts;

                return {
                    host: opts.host ?? 'localhost',
                    port: opts.port,
                    callback:
                        typeof callbackOrHost === 'function'
                            ? (callbackOrHost as () => void)
                            : undefined,
                };
            }

            return undefined; // IPC socket
        }

        if (typeof options === 'number') {
            const host = typeof callbackOrHost === 'string' ? callbackOrHost : 'localhost';
            const cb = args[2];

            return {
                host,
                port: options,
                callback: typeof cb === 'function' ? (cb as () => void) : undefined,
            };
        }

        return undefined;
    };

    const shouldRouteThroughTor = (hostname: string, targetPort?: number): boolean => {
        const torSettings = context.getTorSettings();
        if (!torSettings.running) return false;

        // Never route the connection to the SOCKS proxy itself
        if (
            torSettings.host &&
            torSettings.port &&
            hostname === torSettings.host &&
            targetPort === torSettings.port
        ) {
            return false;
        }

        return !isWhitelistedHost(hostname, context.notRequiredTorDomainsList);
    };

    function connectThroughSocks(
        socket: net.Socket,
        target: { host: string; port: number; callback?: () => void },
        originalConnect: typeof net.Socket.prototype.connect,
    ): net.Socket {
        const { host, port } = context.getTorSettings();
        if (!host || !port) {
            return originalConnect.call(socket, {
                host: target.host,
                port: target.port,
            } as unknown as Parameters<typeof originalConnect>[0]) as net.Socket;
        }

        // Save listeners that should not fire during the SOCKS handshake
        const connectListeners = socket.listeners('connect').slice();
        const dataListeners = socket.listeners('data').slice();
        socket.removeAllListeners('connect');
        socket.removeAllListeners('data');

        // Connect to the SOCKS proxy
        originalConnect.call(socket, { host, port } as unknown as Parameters<
            typeof originalConnect
        >[0]);

        socket.once('connect', () => {
            SocksClient.createConnection({
                existing_socket: socket,
                proxy: { host, port, type: 5 },
                destination: { host: target.host, port: target.port },
                command: 'connect',
            })
                .then(() => {
                    // Restore original listeners
                    for (const listener of dataListeners) {
                        socket.on('data', listener as (...args: unknown[]) => void);
                    }
                    for (const listener of connectListeners) {
                        socket.on('connect', listener as (...args: unknown[]) => void);
                    }

                    // Notify the caller that the connection is established
                    if (target.callback) {
                        target.callback();
                    }
                    socket.emit('connect');
                })
                .catch(err => {
                    socket.destroy(err instanceof Error ? err : new Error(String(err)));
                });
        });

        return socket;
    }

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

        const hostname = details.split(':')[0] ?? '';
        validateRequest({ hostname });

        context.handler({
            type: 'INTERCEPTED_REQUEST',
            method: 'net.Socket.connect',
            details,
        });

        const tcpArgs = parseTcpConnectArgs(args);
        if (tcpArgs && shouldRouteThroughTor(tcpArgs.host, tcpArgs.port)) {
            return connectThroughSocks(this, tcpArgs, originalSocketConnect);
        }

        return originalSocketConnect.apply(
            this,
            args as unknown as Parameters<typeof originalSocketConnect>,
        );
    };
};
