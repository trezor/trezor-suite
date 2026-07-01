// Since Node.js 22 ships a built-in `globalThis.WebSocket` backed by undici.
// Undici is not yet supported by `socks-proxy-agent`
// See issue: https://github.com/TooTallNate/proxy-agents/issues/239
import WebSocketNode from 'ws';

import { isCircuitMisbehaving } from '../isCircuitMisbehaving';
import { type Interceptor } from './interceptorTypes';

export const interceptWebSocket: Interceptor = ({ context, validateRequest }) => {
    const OriginalWebSocket = globalThis.WebSocket;

    // Object.assign copies the readyState constants (CONNECTING/OPEN/CLOSING/CLOSED) onto the
    // factory function itself.
    globalThis.WebSocket = Object.assign(
        // Must be a regular function (not an arrow function): when a constructor explicitly returns an
        // object, `new` uses that returned object instead of `this`.
        function (url: string | URL, protocols?: string | string[]) {
            const urlString = url.toString();
            const { hostname } = new URL(urlString);

            validateRequest({ hostname });

            if (context.getTorSettings().running) {
                const identity = `WebSocket/${hostname}`;
                const agent = context.torIdentities.getIdentity(identity, undefined, 'https');

                const ws = new WebSocketNode(urlString, protocols, { agent });
                ws.on('error', (error: Error) => {
                    if (isCircuitMisbehaving(error)) {
                        context.handler({
                            type: 'CIRCUIT_MISBEHAVING',
                            identity,
                        });
                    }
                });

                return ws;
            }

            return new OriginalWebSocket(url, protocols);
        },
        {
            CONNECTING: WebSocketNode.CONNECTING,
            OPEN: WebSocketNode.OPEN,
            CLOSING: WebSocketNode.CLOSING,
            CLOSED: WebSocketNode.CLOSED,
        },
    ) as unknown as typeof globalThis.WebSocket;
};
