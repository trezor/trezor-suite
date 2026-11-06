import { createHash, timingSafeEqual } from 'crypto';
import { type AddressInfo, type Socket, createServer } from 'net';

import { type Wardd } from './service';

type DebugServerOptions = { wardd: Wardd; token: string; port: number };

/** Opt-in loopback control channel; the pairing token is required on every request. */
export const startDebugServer = async ({ wardd, token, port }: DebugServerOptions) => {
    const sockets = new Set<Socket>();
    const server = createServer(socket => {
        sockets.add(socket);
        socket.on('close', () => sockets.delete(socket));
        socket.setTimeout(5000, () => socket.destroy());
        let input = '';
        socket.on('data', chunk => {
            input += chunk.toString();
            if (input.length > 4096) {
                socket.destroy();

                return;
            }
            if (!input.includes('\n')) return;
            socket.removeAllListeners('data');
            void (async () => {
                try {
                    const request = JSON.parse(input.slice(0, input.indexOf('\n')));
                    const digest = (value: string) => createHash('sha256').update(value).digest();
                    if (
                        typeof request.token !== 'string' ||
                        !timingSafeEqual(digest(request.token), digest(token))
                    ) {
                        socket.end(JSON.stringify({ error: 'unauthorised' }) + '\n');

                        return;
                    }
                    if (['RECONSTRUCT', 'DROP_TRANSITION'].includes(request.command)) {
                        if (
                            typeof request.wardId !== 'string' ||
                            !/^[0-9a-f]{64}$/.test(request.wardId)
                        ) {
                            socket.end(JSON.stringify({ error: 'bad_request' }) + '\n');

                            return;
                        }
                        if (request.command === 'RECONSTRUCT') {
                            socket.end(
                                JSON.stringify(await wardd.debugReconstruct(request.wardId)) + '\n',
                            );

                            return;
                        }
                        if (
                            !Number.isSafeInteger(request.counter) ||
                            request.counter < 1 ||
                            typeof request.root !== 'string' ||
                            !/^[0-9a-f]{64}$/.test(request.root)
                        ) {
                            socket.end(JSON.stringify({ error: 'bad_request' }) + '\n');

                            return;
                        }
                        await wardd.debugDrop(request.wardId, request.counter, request.root);
                        socket.end(
                            JSON.stringify({ dropped: true, counter: request.counter }) + '\n',
                        );

                        return;
                    }
                    if (
                        typeof request.deviceId !== 'string' ||
                        !/^[a-zA-Z0-9_-]{1,64}$/.test(request.deviceId) ||
                        !['PAUSE', 'CONTINUE'].includes(request.command)
                    ) {
                        socket.end(JSON.stringify({ error: 'bad_request' }) + '\n');

                        return;
                    }
                    await wardd.setPaused(request.deviceId, request.command === 'PAUSE');
                    socket.end(
                        JSON.stringify({
                            deviceId: request.deviceId,
                            paused: request.command === 'PAUSE',
                        }) + '\n',
                    );
                } catch {
                    socket.end(JSON.stringify({ error: 'bad_request' }) + '\n');
                }
            })();
        });
        socket.on('error', () => socket.destroy());
    });
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', resolve);
    });

    return {
        port: (server.address() as AddressInfo).port,
        close: () =>
            new Promise<void>(resolve => {
                for (const socket of sockets) socket.destroy();
                server.close(() => resolve());
            }),
    };
};
