import net from 'net';
import { type ServerOptions, type WebSocket, WebSocketServer } from 'ws';

import { WebsocketClient } from './client';

class Client extends WebsocketClient<{ 'foo-event': 'bar-event' }> {}

class ClientWithCustomTimeout extends WebsocketClient<{ 'foo-event': 'bar-event' }> {
    onMessageTimeout(promiseId: number) {
        this.messages.reject(promiseId, new Error('websocket_timeout'));
    }
}

class Server extends WebSocketServer {
    private _url: string;
    fixtures?: any[];

    constructor(options: ServerOptions, callback?: () => void) {
        super(options, callback);

        this._url = `ws://localhost:${options.port}`;
        this.on('connection', ws => {
            ws.on('message', data => this.sendResponse(ws, data));
        });
    }

    public getUrl() {
        return this._url;
    }

    sendResponse(client: WebSocket, data: any) {
        const request = JSON.parse(data);
        const { id, method } = request;
        let response;

        if (method === 'init') {
            response = { success: true };
        }

        if (method === 'ping') {
            response = { success: true };
        }

        if (!response) {
            response = {
                success: false,
                error: { message: `unknown response for method ${method}` },
            };
        }

        client.send(JSON.stringify({ ...response, id }));
    }
}

const createServer = async () => {
    const port = 12345;
    const server = new Server({ port });
    await new Promise<void>((resolve, reject) => {
        server.once('listening', () => resolve());
        server.once('error', error => reject(error));
    });

    return { server, url: `ws://localhost:${port}` };
};

describe('WebsocketClient', () => {
    let server: Server;
    beforeAll(async () => {
        const r = await createServer();
        server = r.server;
    });

    afterAll(() => {
        server.close();
    });

    it('success', async () => {
        const cli = new Client({ url: server.getUrl(), pingTimeout: 500 });
        await cli.connect();

        // types check:
        cli.on('foo-event', event => {
            if (event === 'bar-event') {
                //
            }
        });

        const resp = await cli.sendMessage({ method: 'init' });
        expect(resp.success).toEqual(true);

        await cli.disconnect();
    });

    it('ping', async () => {
        jest.useFakeTimers();

        const cli = new Client({ url: server.getUrl(), pingTimeout: 5000 });
        // @ts-expect-error ping is protected
        const pingSpy = jest.spyOn(cli, 'ping');
        await cli.connect();

        // call first messages to init ping
        const resp = await cli.sendMessage({ method: 'init' });
        expect(resp.success).toEqual(true);
        // wait for ping
        await jest.advanceTimersByTimeAsync(4 * 5000);
        expect(pingSpy).toHaveBeenCalledTimes(4);

        await cli.disconnect();

        pingSpy.mockRestore();
        jest.useRealTimers();
    });

    it('reconnect with sync disconnect()', async () => {
        const cli = new WebsocketClient({ url: server.getUrl() });
        await cli.connect();
        cli.disconnect(); // NOTE: intentionally not awaited
        await cli.connect();

        const resp = await cli.sendMessage({ method: 'init' });
        expect(resp.success).toEqual(true);

        cli.disconnect();
    });

    it('client.disconnect()', async () => {
        const cli = new Client({ url: server.getUrl() });
        const disconnectedSpy = jest.fn();
        cli.on('disconnected', disconnectedSpy);

        // calling before connection
        await cli.disconnect();
        expect(disconnectedSpy).toHaveBeenCalledTimes(0);

        await cli.connect();
        await cli.disconnect();
        expect(disconnectedSpy).toHaveBeenCalledTimes(1);
    });

    it('client.dispose()', async () => {
        const cli = new Client({ url: server.getUrl() });
        const disconnectedSpy = jest.fn();
        cli.on('disconnected', disconnectedSpy);

        // calling before connection
        cli.dispose();
        expect(disconnectedSpy).toHaveBeenCalledTimes(0);

        // set listener again, previous .dispose removed it
        cli.on('disconnected', disconnectedSpy);
        await cli.connect();
        cli.dispose();
        expect(disconnectedSpy).toHaveBeenCalledTimes(0);
    });

    it('throws connection error', async () => {
        const cli = new Client({ url: 'invalid-url' });

        await expect(() => cli.connect()).rejects.toThrow('invalid-url');
    });

    it('throws timeout error on sendMessage and kills the connection', async () => {
        const cli = new Client({ url: server.getUrl() });
        await cli.connect();
        const disconnectedSpy = jest.fn();
        cli.on('disconnected', disconnectedSpy);
        const disconnectedPromise = new Promise<void>(resolve => {
            cli.once('disconnected', resolve);
        });

        // do not respond, client should timeout
        const sendSpy = jest.spyOn(server, 'sendResponse').mockImplementation(() => {});
        await expect(() => cli.sendMessage({ method: 'init' }, { timeout: 100 })).rejects.toThrow(
            'websocket_timeout',
        );

        // client is disconnected
        expect(cli.isConnected()).toEqual(false);
        // wait for ws.close propagation
        await disconnectedPromise;
        expect(disconnectedSpy).toHaveBeenCalledTimes(1);

        sendSpy.mockRestore();
        cli.dispose();
    });

    it('throws timeout error on sendMessage', async () => {
        const cli = new ClientWithCustomTimeout({ url: server.getUrl() });
        await cli.connect();

        const sendSpy = jest.spyOn(server, 'sendResponse').mockImplementation((wsCli, data) => {
            const request = JSON.parse(data);
            if (request.method !== 'init') {
                setTimeout(() => {
                    wsCli.send(JSON.stringify({ id: request.id, success: true }));
                }, 100);
            }
        });

        const initPromise = cli.sendMessage({ method: 'init' }, { timeout: 100 });
        // move closer to the timeout and call second message
        await new Promise(resolve => setTimeout(resolve, 50));
        const infoPromise = cli.sendMessage({ method: 'get-info' }, { timeout: 500 });

        // init should timeout
        await expect(() => initPromise).rejects.toThrow('websocket_timeout');
        // second message is not rejected
        const result = await infoPromise;
        await expect(result).toEqual({ id: '1', success: true });

        // client is still connected
        expect(cli.isConnected()).toEqual(true);

        sendSpy.mockRestore();
        cli.dispose();
    });

    describe('connect with AbortSignal', () => {
        it('rejects with the reason of a signal which is already aborted', async () => {
            const cli = new Client({ url: server.getUrl() });

            await expect(
                cli.connect({ signal: AbortSignal.abort(new Error('stop')) }),
            ).rejects.toThrow('stop');

            expect(cli.isConnected()).toEqual(false);
        });

        it('cancels a connection in progress and allows to connect again', async () => {
            const cli = new Client({ url: server.getUrl() });
            const controller = new AbortController();

            const connecting = cli.connect({ signal: controller.signal });
            controller.abort(new Error('stop'));

            await expect(connecting).rejects.toThrow('stop');
            expect(cli.isConnected()).toEqual(false);

            await cli.connect();
            expect(cli.isConnected()).toEqual(true);

            cli.dispose();
        });

        it('closes the socket of a connection which never completes', async () => {
            const hanging = net.createServer();
            await new Promise<void>(resolve => hanging.listen(0, '127.0.0.1', resolve));
            const { port } = hanging.address() as net.AddressInfo;
            const accepted = new Promise<net.Socket>(resolve =>
                hanging.once('connection', resolve),
            );

            const cli = new Client({ url: `ws://127.0.0.1:${port}` });
            const controller = new AbortController();
            const connecting = cli.connect({ signal: controller.signal });
            const socket = await accepted;
            const closed = new Promise<void>(resolve => socket.once('close', () => resolve()));

            controller.abort(new Error('stop'));

            await expect(connecting).rejects.toThrow('stop');
            await closed;

            await new Promise(resolve => hanging.close(resolve));
        });

        it('keeps an established connection when aborted afterwards', async () => {
            const cli = new Client({ url: server.getUrl() });
            const controller = new AbortController();

            await cli.connect({ signal: controller.signal });
            controller.abort();

            expect(cli.isConnected()).toEqual(true);

            cli.dispose();
        });

        it('connects again when called in the same tick as the abort', async () => {
            const cli = new Client({ url: server.getUrl() });
            const controller = new AbortController();

            const cancelled = cli.connect({ signal: controller.signal });
            controller.abort(new Error('stop'));
            const restarted = cli.connect();

            await expect(cancelled).rejects.toThrow('stop');
            await restarted;
            expect(cli.isConnected()).toEqual(true);

            cli.dispose();
        });

        it('keeps the new attempt tracked after the cancelled one settles', async () => {
            const cli = new Client({ url: server.getUrl() });
            const controller = new AbortController();
            const onConnection = jest.fn();
            server.on('connection', onConnection);

            const cancelled = cli.connect({ signal: controller.signal });
            controller.abort(new Error('stop'));
            const restarted = cli.connect();
            await expect(cancelled).rejects.toThrow('stop');

            // joins the new attempt instead of opening another socket
            const joined = cli.connect();
            await Promise.all([restarted, joined]);
            expect(onConnection).toHaveBeenCalledTimes(1);

            server.off('connection', onConnection);
            cli.dispose();
        });

        it('rejects only the joining call when its own signal is aborted', async () => {
            const cli = new Client({ url: server.getUrl() });
            const controller = new AbortController();

            const initiator = cli.connect();
            const joiner = cli.connect({ signal: controller.signal });
            controller.abort(new Error('stop'));

            await expect(joiner).rejects.toThrow('stop');
            await initiator;
            expect(cli.isConnected()).toEqual(true);

            cli.dispose();
        });

        it('rejects without waiting for a closing socket to finish closing', async () => {
            const cli = new Client({ url: server.getUrl() });
            await cli.connect();
            const onDisconnected = jest.fn();
            cli.on('disconnected', onDisconnected);
            const controller = new AbortController();

            const disconnecting = cli.disconnect();
            const connecting = cli.connect({ signal: controller.signal });
            controller.abort(new Error('stop'));

            await expect(connecting).rejects.toThrow('stop');
            expect(onDisconnected).not.toHaveBeenCalled();

            await disconnecting;
            cli.dispose();
        });

        it('does not leave a listener behind when the wait for a closing socket is aborted', async () => {
            const cli = new Client({ url: server.getUrl() });
            await cli.connect();
            const disconnecting = cli.disconnect();
            const listenerCount = cli.listenerCount('disconnected');
            const controller = new AbortController();

            const connecting = cli.connect({ signal: controller.signal });
            controller.abort(new Error('stop'));

            await expect(connecting).rejects.toThrow('stop');
            expect(cli.listenerCount('disconnected')).toEqual(listenerCount);

            await disconnecting;
            cli.dispose();
        });
    });

    describe('connection in progress', () => {
        it('is cancelled by disconnect() and allows to connect again', async () => {
            const cli = new Client({ url: server.getUrl() });

            const connecting = cli.connect();
            await cli.disconnect();

            await expect(connecting).rejects.toThrow('websocket_disconnected');
            expect(cli.isConnected()).toEqual(false);

            await cli.connect();
            expect(cli.isConnected()).toEqual(true);

            cli.dispose();
        });

        it('is cancelled by dispose()', async () => {
            const cli = new Client({ url: server.getUrl() });

            const connecting = cli.connect();
            cli.dispose();

            await expect(connecting).rejects.toThrow('websocket_disconnected');
            expect(cli.isConnected()).toEqual(false);
        });

        it('is cancelled for every caller sharing it', async () => {
            const cli = new Client({ url: server.getUrl() });

            const first = cli.connect();
            const second = cli.connect();
            await cli.disconnect();

            await expect(first).rejects.toThrow('websocket_disconnected');
            await expect(second).rejects.toThrow('websocket_disconnected');
        });

        it('connects again when called in the same tick as disconnect()', async () => {
            const cli = new Client({ url: server.getUrl() });

            const cancelled = cli.connect();
            cli.disconnect();
            const restarted = cli.connect();

            await expect(cancelled).rejects.toThrow('websocket_disconnected');
            await restarted;
            expect(cli.isConnected()).toEqual(true);

            cli.dispose();
        });

        it('can be cancelled by disconnect() after a previous attempt was cancelled', async () => {
            const cli = new Client({ url: server.getUrl() });
            const controller = new AbortController();

            const cancelled = cli.connect({ signal: controller.signal });
            controller.abort(new Error('stop'));
            const restarted = cli.connect();
            await expect(cancelled).rejects.toThrow('stop');

            await cli.disconnect();

            await expect(restarted).rejects.toThrow('websocket_disconnected');
            expect(cli.isConnected()).toEqual(false);
        });

        it('is shared by calls waiting for a closing socket', async () => {
            const cli = new Client({ url: server.getUrl() });
            await cli.connect();
            const onConnection = jest.fn();
            server.on('connection', onConnection);

            const disconnecting = cli.disconnect();
            const first = cli.connect();
            const second = cli.connect();
            await Promise.all([first, second, disconnecting]);

            expect(cli.isConnected()).toEqual(true);
            expect(onConnection).toHaveBeenCalledTimes(1);

            server.off('connection', onConnection);
            cli.dispose();
        });
    });
});
