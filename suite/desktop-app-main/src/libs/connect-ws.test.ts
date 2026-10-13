import net from 'net';

import { exposeConnectWs } from './connect-ws';
import { createHttpReceiver } from './http-receiver';
import { Logger } from './logger';

type ExposeConnectWsParams = Parameters<typeof exposeConnectWs>[0];

const LOOPBACK = '127.0.0.1';
const logger = new Logger('mute');

// A raw socket instead of a `ws` client, so that any request target can be sent and the exact
// response observed.
const rawUpgrade = (port: number, path: string) => {
    const chunks: Buffer[] = [];
    const socket = net.connect(port, LOOPBACK, () =>
        socket.write(
            [
                `GET ${path} HTTP/1.1`,
                `Host: ${LOOPBACK}:${port}`,
                'Upgrade: websocket',
                'Connection: Upgrade',
                'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==',
                'Sec-WebSocket-Version: 13',
                '',
                '',
            ].join('\r\n'),
        ),
    );
    socket.on('data', chunk => chunks.push(chunk));
    const closed = new Promise<boolean>(resolve => {
        const timeout = setTimeout(() => resolve(false), 1000);
        socket.on('close', () => {
            clearTimeout(timeout);
            resolve(true);
        });
    });

    return { socket, closed, received: () => Buffer.concat(chunks).toString() };
};

describe('connect-ws upgrade', () => {
    let receiver: ReturnType<typeof createHttpReceiver> | undefined;
    const sockets: net.Socket[] = [];

    const startServer = async () => {
        receiver = createHttpReceiver({ logger, port: 0 });
        const startResult = await receiver.start();
        if (!startResult.success) throw new Error(startResult.message);
        exposeConnectWs({
            httpReceiver: receiver,
            logger,
            mainThreadEmitter: {} as ExposeConnectWsParams['mainThreadEmitter'],
            mainWindowProxy: {} as ExposeConnectWsParams['mainWindowProxy'],
            store: {} as ExposeConnectWsParams['store'],
        });

        return startResult.payload.port;
    };

    const probe = (port: number, path: string) => {
        const upgrade = rawUpgrade(port, path);
        sockets.push(upgrade.socket);

        return upgrade;
    };

    afterEach(async () => {
        sockets.splice(0).forEach(socket => socket.destroy());
        await receiver?.stop();
    });

    // `new URL()` used to throw on this target. Jest fails the test on any uncaught exception.
    it('closes an upgrade with a request target that new URL() rejects', async () => {
        const port = await startServer();
        const upgrade = probe(port, '//[');

        expect(await upgrade.closed).toBe(true);
        expect(upgrade.received()).toBe('');
    });
});
