/* eslint-disable no-console */

import WebSocket from 'ws';
import * as net from 'net';

// enables parallelization using a free port
export const getFreePort = () =>
    new Promise<number>((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, () => {
            const { port } = server.address() as net.AddressInfo;
            server.close(() => {
                resolve(port);
            });
        });
    });

interface Server extends WebSocket.Server {
    stop: () => void;
    port: number;
}

export const start = async ({ endpoints }: any) => {
    const port = await getFreePort();

    const serverPromise = new Promise<Server>((resolve, reject) => {
        // @ts-expect-error
        const server: Server = new WebSocket.Server({ port });
        server.port = port;
        server.on('connection', ws => {
            ws.on('message', (data: any) => {
                const json = JSON.parse(data);

                console.log('[mocked blockbook request]:', json.method, json.id);
                const response = endpoints[json.method](json.params);

                console.log('[mocked blockbook response]:', response);

                ws.send(JSON.stringify({ data: JSON.parse(response), id: json.id }));
            });
        });

        server.on('listening', () => {
            resolve(server);
        });

        server.on('error', error => {
            console.log('error');
            reject(error);
        });

        server.stop = () => {
            server.clients.forEach(socket => {
                // Soft close
                socket.close();

                process.nextTick(() => {
                    // @ts-expect-error
                    if ([socket.OPEN, socket.CLOSING].includes(socket.readyState)) {
                        // Socket still hangs, hard close
                        socket.terminate();
                    }
                });
            });
        };
    });

    const server = await serverPromise;

    return server;
};
