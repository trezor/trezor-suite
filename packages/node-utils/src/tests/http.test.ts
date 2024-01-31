import { HttpServer, parseBodyJSON, parseBodyText, allowOrigins } from '../http';

type Events = {
    foo: (arg: string) => void;
};

const muteLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

describe('HttpServer', () => {
    let server: HttpServer<Events>;
    beforeEach(() => {
        server = new HttpServer<Events>({
            logger: muteLogger,
        });
    });

    afterEach(done => {
        server.stop().finally(() => {
            done();
        });
    });

    test('getServerAddress before server start', () => {
        expect(() => server.getServerAddress()).toThrowError();
    });

    test('getServerAddress after server start', async () => {
        await server.start();
        expect(server.getServerAddress()).toMatchObject({
            address: '127.0.0.1',
            family: 'IPv4',
            port: expect.any(Number),
        });
    });

    test('getInfo', async () => {
        await server.start();
        expect(server.getInfo()).toMatchObject({
            url: expect.any(String),
        });
    });

    test('a port can be passed to the constructor', async () => {
        server = new HttpServer<Events>({ logger: muteLogger, port: 65526 });
        await server.start();
        expect(server.getServerAddress()).toMatchObject({
            port: 65526,
        });
    });

    test('register a route and getRouterAddress', async () => {
        const handler = jest.fn((_request, response, _next) => {
            response.end('ok');
        });
        server.get('/foo', [handler]);
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        const res = await fetch(`http://${address.address}:${address.port}/foo`);
        expect(res.status).toEqual(200);
        expect(handler).toHaveBeenCalled();

        expect(server.getRouteAddress('/foo')).toEqual(
            `http://${address.address}:${address.port}/foo`,
        );
    });

    test('set response headers in a custom middleware handler', async () => {
        const middlewareHandler = jest.fn((request, response, next) => {
            response.setHeader('foo', 'bar');
            next(request, response);
        });
        const handler = jest.fn((_request, response) => {
            response.end('ok');
        });
        server.get('/foo', [middlewareHandler, handler]);
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        const res = await fetch(`http://${address.address}:${address.port}/foo`);
        expect(res.headers.get('foo')).toEqual('bar');
    });

    test('calling endpoint which as no defined handler', async () => {
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();

        fetch(`http://${address.address}:${address.port}/foo`).catch(_err => {});

        await new Promise(resolve => setTimeout(resolve, 1000));

        server.stop();

        await new Promise<void>(resolve => {
            server.on('server/closed', () => {
                resolve();
            });
        });
    });

    test('aborting request', async () => {
        const controller = new AbortController();
        const { signal } = controller;
        server.get('/foo', [
            (_request, response) => {
                setTimeout(() => response.end('ok'), 1000);
            },
        ]);
        await server.start();

        const address = server.getServerAddress();
        expect(address).toBeDefined();
        fetch(`http://${address.address}:${address.port}/foo`, { signal }).catch(_err => {});
        await new Promise(resolve => setTimeout(resolve, 500));
        controller.abort();
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(muteLogger.info).toHaveBeenLastCalledWith(
            expect.any(String),
            'Request /foo aborted',
        );
    });

    test('allowOrigin middleware lets request with allowed origin through', async () => {
        const handler = jest.fn((_request, response) => {
            response.end('ok');
        });

        server.get('/foo', [allowOrigins(['*']), allowOrigins(['*.meow.com']), handler]);

        server.get('/foo-bar', [
            // empty string is allowed origin when referer is not defined
            allowOrigins(['']),
            handler,
        ]);
        await server.start();

        const address = server.getServerAddress();
        expect(address).toBeDefined();
        const res1 = await fetch(`http://${address.address}:${address.port}/foo`, {
            headers: {
                referer: 'http://sub.meow.com',
            },
        });

        const res2 = await fetch(`http://${address.address}:${address.port}/foo-bar`);

        expect(res1.status).toEqual(200);
        expect(res2.status).toEqual(200);
    });

    test('handler order', async () => {
        const calledHandlers: string[] = [];
        const handler =
            (name: string, end?: boolean) =>
            (req: any, res: any, next: (req: any, res: any) => void) => {
                calledHandlers.push(name);
                if (end) res.end('ok');
                else next(req, res);
            };

        server.use([handler('use1'), handler('use2')]);
        server.post('/foo', [handler('post1', true)]);
        server.get('/foo', [handler('get1', true)]);

        await server.start();
        const { address, port } = server.getServerAddress();

        await fetch(`http://${address}:${port}/foo`);

        expect(calledHandlers).toStrictEqual(['use1', 'use2', 'get1']);
    });

    test('endpoint with params returns params in response', async () => {
        const handler = jest.fn((request, response) => {
            response.end(JSON.stringify(request.params));
        });
        server.get('/foo/:id', [handler]);
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        const res = await fetch(`http://${address.address}:${address.port}/foo/123`);
        expect(res.status).toEqual(200);
        expect(await res.json()).toEqual({ id: '123' });
    });

    test('sending request body, parsing it as JSON using parseBodyJSON and returning it in response', async () => {
        const handler = jest.fn((request, response) => {
            response.end(JSON.stringify(request.body));
        });
        server.post('/foo', [parseBodyJSON, handler]);
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        const res = await fetch(`http://${address.address}:${address.port}/foo`, {
            method: 'POST',
            body: JSON.stringify({ foo: 'bar' }),
        });
        expect(res.status).toEqual(200);
        expect(await res.json()).toEqual({ foo: 'bar' });
    });

    test('sending request body, parsing it as text using parseBodyText and returning it in response', async () => {
        const handler = jest.fn((request, response) => {
            response.end(request.body);
        });
        server.post('/foo', [parseBodyText, handler]);
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        const res = await fetch(`http://${address.address}:${address.port}/foo`, {
            method: 'POST',
            body: 'foo',
        });
        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('foo');
    });
});
