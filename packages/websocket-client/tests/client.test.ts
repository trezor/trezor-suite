import { ServerOptions, WebSocket } from 'ws';

import { WebsocketClient } from '../src/client';

class Client extends WebsocketClient<{ 'foo-event': 'bar-event' }> {
    createWebsocket() {
        return this.initWebsocket(this.options);
    }
    ping() {
        return this.sendMessage({ method: 'ping' });
    }
    sendMessage(message: Record<string, any>) {
        return super.sendMessage(message);
    }
}

class Server extends WebSocket.Server {
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

    private sendResponse(client: WebSocket, data: any) {
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
        const cli = new Client({ url: server.getUrl() });
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
});
