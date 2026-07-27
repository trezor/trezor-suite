import { type ServerOptions, type WebSocket, WebSocketServer } from 'ws';

import { WebsocketClient } from '../src/client';

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

        // do not respond, client should timeout
        const sendSpy = jest.spyOn(server, 'sendResponse').mockImplementation(() => {});
        await expect(() => cli.sendMessage({ method: 'init' }, { timeout: 100 })).rejects.toThrow(
            'websocket_timeout',
        );

        // client is disconnected
        expect(cli.isConnected()).toEqual(false);
        // wait for ws.close propagation
        await new Promise(resolve => setTimeout(resolve, 10));
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
});
