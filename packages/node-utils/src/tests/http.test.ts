import url from 'url';

import { type Log } from '@trezor/utils';

import { getFreePort } from '../getFreePort';
import {
    HttpServer,
    type ParamsValidatorHandler,
    type RequestHandler,
    allowReferers,
    parseBodyJSON,
    parseBodyText,
} from '../http';

type Events = {
    foo: (arg: string) => void;
};

const muteLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
} as any as Log;

describe('HttpServer', () => {
    let server: HttpServer<Events>;
    beforeEach(() => {
        server = new HttpServer<Events>({
            logger: muteLogger,
        });
    });

    afterEach(
        () =>
            new Promise<void>(done => {
                server.stop().finally(() => {
                    done();
                });
            }),
    );

    test('getServerAddress before server start', () => {
        expect(() => server.getServerAddress()).toThrow();
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
        expect(muteLogger.info).toHaveBeenLastCalledWith('Request GET /foo aborted');
    });

    test('allowReferer middleware lets request with allowed referer through', async () => {
        const handler = jest.fn((_request, response) => {
            response.end('ok');
        });

        server.get('/foo', [allowReferers(['*']), allowReferers(['*.meow.com']), handler]);

        server.get('/foo-bar', [
            // empty string is allowed origin when referer is not defined
            allowReferers(['']),
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
            (name: string, end?: boolean): RequestHandler<any, any> =>
            (req, res, next) => {
                calledHandlers.push(name);
                if (end) res.end('ok');
                else next(req, res);
            };

        server.use([handler('use1'), handler('use2')]);
        server.post('/foo', [
            (_req, res) => {
                calledHandlers.push('post1');
                res.end('ok');
            },
        ]);
        server.get('/foo', [handler('get1', true)]);

        await server.start();
        const { address, port } = server.getServerAddress();

        await fetch(`http://${address}:${port}/foo`);

        expect(calledHandlers).toStrictEqual(['use1', 'use2', 'get1']);
    });

    test('handlers with params and body validation', async () => {
        type Session = `${number}`;
        type Body = { foo: 'bar' }[];

        const paramsValidator: ParamsValidatorHandler<{
            session: Session;
        }> = (request, response, next) => {
            if (
                typeof request.params.session === 'string' &&
                /^\d+$/.test(request.params.session)
            ) {
                next(request as Parameters<typeof next>[0], response);
            } else {
                response.statusCode = 400;
                response.end(JSON.stringify({ error: 'Invalid params' }));
            }
        };
        const bodyValidator: RequestHandler<JSON, Body> = (request, response, next) => {
            if (Array.isArray(request.body)) {
                next({ ...request, body: request.body }, response);
            } else {
                response.statusCode = 400;
                response.end(JSON.stringify({ error: 'Invalid body' }));
            }
        };

        const isSession = jest.fn((_val: Session) => {});
        const isValidJSON = jest.fn((_val: Body) => {});

        // case with params validator and body parser
        server.post('/foo-1/:session', [
            paramsValidator,
            parseBodyJSON,
            bodyValidator,
            ({ body, params }, res) => {
                isSession(params.session);
                isValidJSON(body);
                res.end('ok');
            },
        ]);

        // case with params validator without body parser
        server.post('/foo-2/:session', [
            paramsValidator,
            ({ body, params }, res) => {
                isSession(params.session);
                // @ts-expect-error body = unknown
                isValidJSON(body);
                res.end('ok');
            },
        ]);

        // case without params validator with body parser
        server.post('/foo-3/:session', [
            parseBodyJSON,
            bodyValidator,
            ({ body, params }, res) => {
                // @ts-expect-error params = unknown
                isSession(params.session);
                isValidJSON(body);
                res.end('ok');
            },
        ]);

        // case without params validator and without body parser
        server.post('/foo-4/:session', [
            ({ body, params }, res) => {
                // @ts-expect-error params = unknown
                isSession(params.session);
                // @ts-expect-error body = unknown
                isValidJSON(body);
                res.end('ok');
            },
        ]);

        await server.start();
        const { address, port } = server.getServerAddress();

        const post = (path: string, body: any) =>
            fetch(`http://${address}:${port}/${path}`, {
                method: 'POST',
                body: body ? JSON.stringify(body) : undefined,
            });

        let res;
        res = await post('foo-1/321', { foo: 'bar' }); // body != array, fails in bodyValidator
        expect(res.status).toEqual(400);
        expect(await res.json()).toEqual({ error: 'Invalid body' });

        res = await post('foo-1/321', undefined); // body != array, fails in parseBodyJSON
        expect(res.status).toEqual(400);
        const { error } = await res.json();
        expect(error).toMatch('Invalid body');

        res = await post('foo-1/not-a-number', { foo: 'bar' });
        expect(res.status).toEqual(400);
        expect(await res.json()).toEqual({ error: 'Invalid params' });

        res = await post('foo-1/321', [{ foo: 'bar' }]);
        expect(res.status).toEqual(200);

        expect(isSession).toHaveBeenLastCalledWith('321');
        expect(isValidJSON).toHaveBeenLastCalledWith([{ foo: 'bar' }]);

        res = await post('foo-2/321', {});
        expect(res.status).toEqual(200);
        expect(isSession).toHaveBeenLastCalledWith('321');
        expect(isValidJSON).toHaveBeenLastCalledWith(undefined);

        res = await post('foo-3/not-a-number', []);
        expect(res.status).toEqual(200);
        expect(isSession).toHaveBeenLastCalledWith('not-a-number');
        expect(isValidJSON).toHaveBeenLastCalledWith([]);

        res = await post('foo-4/not-a-number', {});
        expect(res.status).toEqual(200);
        expect(isSession).toHaveBeenLastCalledWith('not-a-number');
        expect(isValidJSON).toHaveBeenLastCalledWith(undefined);
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

    test('query string as array', async () => {
        const handler = jest.fn((request, response) => {
            const { search } = url.parse(request.url, true);
            response.end(search);
        });
        server.post('/foo', [parseBodyText, handler]);
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        const res = await fetch(`http://${address.address}:${address.port}/foo?a=1&a=2&b=3`, {
            method: 'POST',
            body: 'foo',
        });
        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('?a=1&a=2&b=3');
    });

    test('should get query string as url when using encoded parameters', async () => {
        const handler = jest.fn((request, response) => {
            const { search } = url.parse(request.url, true);
            response.end(search);
        });
        server.post('/foo', [parseBodyText, handler]);
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        const res = await fetch(
            `http://${address.address}:${address.port}/foo?c=%2Fredirect%2Fdetail`,
            {
                method: 'POST',
                body: 'foo',
            },
        );
        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('?c=%2Fredirect%2Fdetail');
    });

    test('should not get query string as url when using invalid encoded parameters', async () => {
        const handler = jest.fn((request, response) => {
            const { search } = url.parse(request.url, true);
            response.end(search);
        });
        server.post('/foo', [parseBodyText, handler]);
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        const res = await fetch(`http://${address.address}:${address.port}/foo?c=%E0%A4%A`, {
            method: 'POST',
            body: 'foo',
        });
        expect(res.status).toEqual(403);
        expect(await res.text()).toEqual('');
    });

    test('query string sanitization', async () => {
        const handler = jest.fn((request, response) => {
            const { search } = url.parse(request.url, true);
            response.end(search);
        });
        server.post('/foo', [parseBodyText, handler]);
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        const res = await fetch(
            `http://${address.address}:${address.port}/foo?ok=meow&notok=javascript:alert(1)`,
            {
                method: 'POST',
                body: 'foo',
            },
        );
        expect(res.status).toEqual(403);
    });

    test('params segment sanitization', async () => {
        const handler = jest.fn((request, response) => {
            response.end(JSON.stringify(request.params));
        });
        server.post('/foo/:id', [parseBodyText, handler]);
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        const res = await fetch(
            `http://${address.address}:${address.port}/foo/javascript:alert(1)`,
            {
                method: 'POST',
                body: 'foo',
            },
        );
        expect(res.status).toEqual(403);
    });

    test('any registered route is active  by default and can be deactivated', async () => {
        const handler = jest.fn((_request, response) => {
            response.end('ok');
        });
        server.get('/foo', [handler]);
        server.get('/bar', [handler]);
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        let res = await fetch(`http://${address.address}:${address.port}/foo`);
        expect(res.status).toEqual(200);
        res = await fetch(`http://${address.address}:${address.port}/bar`);
        expect(res.status).toEqual(200);

        server.deactivateRoute('/foo');
        res = await fetch(`http://${address.address}:${address.port}/foo`);
        expect(res.status).toEqual(404);
        res = await fetch(`http://${address.address}:${address.port}/bar`);
        expect(res.status).toEqual(200);
    });

    test('port negotiation, first available port is occupied, second is free', async () => {
        const [freePort1, freePort2] = await getFreePort(2);
        // start server using 'ports' array. first port is empty and will be used
        server = new HttpServer<Events>({ logger: muteLogger, port: freePort1 });
        await server.start();
        expect(server.getServerAddress()).toMatchObject({
            port: freePort1,
        });

        const server2 = new HttpServer<Events>({
            logger: muteLogger,
            ports: [freePort1, freePort2],
        });

        await server2.start();
        expect(server2.getServerAddress()).toMatchObject({
            port: freePort2,
        });

        await Promise.all([server.stop(), server2.stop()]);
    });

    test('port negotiation - it is possible to start and stop server multiple times', async () => {
        const [freePort1] = await getFreePort(1);

        server = new HttpServer<Events>({ logger: muteLogger, ports: [freePort1] });
        await server.start();
        expect(server.getServerAddress()).toMatchObject({
            port: freePort1,
        });

        await server.stop();
        await server.start();
        expect(server.getServerAddress()).toMatchObject({
            port: freePort1,
        });

        await server.stop();
    });

    test('port negotiation - even when started using random port, the resulting port is stored for future use', async () => {
        server = new HttpServer<Events>({ logger: muteLogger, ports: [0] });
        await server.start();
        const address = server.getServerAddress();
        expect(address).toBeDefined();
        expect(address.port).toBeGreaterThan(0);

        // stop and start again, the port should be the same
        await server.stop();
        await server.start();
        const newAddress = server.getServerAddress();
        expect(newAddress.port).toEqual(address.port);
    });

    describe('route matching logic (express.js-like)', () => {
        test('unregistered route does not match any registered route', async () => {
            const handler1 = jest.fn((_request, response) => {
                response.end('enumerate');
            });
            const handler2 = jest.fn((_request, response) => {
                response.end('listen');
            });

            server.post('/enumerate', [handler1]);
            server.post('/listen', [handler2]);

            await server.start();
            const { address, port } = server.getServerAddress();

            // Request to unregistered route /abort/1 should NOT match /enumerate or /listen
            const res = await fetch(`http://${address}:${port}/abort/1`, {
                method: 'POST',
            });

            expect(res.status).toEqual(404);
            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
        });

        test('route with params does not match request with extra segments', async () => {
            const handler = jest.fn((_request, response) => {
                response.end('ok');
            });

            // Route expects exactly /acquire/:path/:previous (4 segments total)
            server.post('/acquire/:path/:previous', [handler]);

            await server.start();
            const { address, port } = server.getServerAddress();

            // Request with 5 segments should NOT match
            const res = await fetch(`http://${address}:${port}/acquire/1/2/extra`, {
                method: 'POST',
            });

            expect(res.status).toEqual(404);
            expect(handler).not.toHaveBeenCalled();
        });

        test('route with params does not match request with missing segments', async () => {
            const handler = jest.fn((_request, response) => {
                response.end('ok');
            });

            // Route expects exactly /acquire/:path/:previous (4 segments total)
            server.post('/acquire/:path/:previous', [handler]);

            await server.start();
            const { address, port } = server.getServerAddress();

            // Request with 3 segments (missing :previous) should NOT match
            const res = await fetch(`http://${address}:${port}/acquire/1`, {
                method: 'POST',
            });

            expect(res.status).toEqual(404);
            expect(handler).not.toHaveBeenCalled();
        });

        test('route with params matches request with exact segments', async () => {
            const handler = jest.fn((request, response) => {
                response.end(JSON.stringify(request.params));
            });

            server.post('/acquire/:path/:previous', [handler]);

            await server.start();
            const { address, port } = server.getServerAddress();

            // Request with exactly 4 segments should match
            const res = await fetch(`http://${address}:${port}/acquire/1/2`, {
                method: 'POST',
            });

            expect(res.status).toEqual(200);
            expect(handler).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: { path: '1', previous: '2' },
                }),
                expect.anything(),
                expect.anything(),
                expect.anything(),
            );
        });

        test('single param route matches correctly', async () => {
            const handler = jest.fn((request, response) => {
                response.end(JSON.stringify(request.params));
            });

            server.post('/release/:session', [handler]);

            await server.start();
            const { address, port } = server.getServerAddress();

            // Request with exactly 3 segments should match
            const res = await fetch(`http://${address}:${port}/release/123`, {
                method: 'POST',
            });

            expect(res.status).toEqual(200);
            expect(handler).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: { session: '123' },
                }),
                expect.anything(),
                expect.anything(),
                expect.anything(),
            );
        });

        test('exact route takes precedence over parameterized route', async () => {
            const paramHandler = jest.fn((_request, response) => {
                response.end('param');
            });
            const exactHandler = jest.fn((_request, response) => {
                response.end('exact');
            });

            server.post('/user/:id', [paramHandler]);
            server.post('/user/me', [exactHandler]);

            await server.start();
            const { address, port } = server.getServerAddress();

            const res = await fetch(`http://${address}:${port}/user/me`, {
                method: 'POST',
            });

            expect(res.status).toEqual(200);
            await expect(res.text()).resolves.toEqual('exact');
            expect(exactHandler).toHaveBeenCalled();
            expect(paramHandler).not.toHaveBeenCalled();
        });

        test('more specific route takes precedence over less specific route', async () => {
            const lessSpecificHandler = jest.fn((_request, response) => {
                response.end('less');
            });
            const moreSpecificHandler = jest.fn((_request, response) => {
                response.end('more');
            });

            // /a/:b has 1 fixed segment, 1 param
            server.post('/a/:b', [lessSpecificHandler]);
            // /a/x/:c has 2 fixed segments, 1 param (more specific)
            server.post('/a/x/:c', [moreSpecificHandler]);

            await server.start();
            const { address, port } = server.getServerAddress();

            const res = await fetch(`http://${address}:${port}/a/x/y`, {
                method: 'POST',
            });

            expect(res.status).toEqual(200);
            await expect(res.text()).resolves.toEqual('more');
            expect(moreSpecificHandler).toHaveBeenCalled();
            expect(lessSpecificHandler).not.toHaveBeenCalled();
        });

        test('method mismatch does not match route', async () => {
            const getHandler = jest.fn((_request, response) => {
                response.end('get');
            });
            const postHandler = jest.fn((_request, response) => {
                response.end('post');
            });

            server.get('/foo', [getHandler]);
            server.post('/foo', [postHandler]);

            await server.start();
            const { address, port } = server.getServerAddress();

            // Request with PUT method should not match either route
            const res = await fetch(`http://${address}:${port}/foo`, {
                method: 'PUT',
            });

            expect(res.status).toEqual(404);
            expect(getHandler).not.toHaveBeenCalled();
            expect(postHandler).not.toHaveBeenCalled();
        });

        test('deeply nested parameterized route matches correctly', async () => {
            const handler = jest.fn((request, response) => {
                response.end(JSON.stringify(request.params));
            });

            server.post('/call/:session', [handler]);

            await server.start();
            const { address, port } = server.getServerAddress();

            const res = await fetch(`http://${address}:${port}/call/abc123`, {
                method: 'POST',
            });

            expect(res.status).toEqual(200);
            expect(handler).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: { session: 'abc123' },
                }),
                expect.anything(),
                expect.anything(),
                expect.anything(),
            );
        });

        test('routes with similar prefixes do not cross-match', async () => {
            const enumerateHandler = jest.fn((_request, response) => {
                response.end('enumerate');
            });
            const acquireHandler = jest.fn((_request, response) => {
                response.end('acquire');
            });

            server.post('/enumerate', [enumerateHandler]);
            server.post('/acquire/:path/:previous', [acquireHandler]);

            await server.start();
            const { address, port } = server.getServerAddress();

            // /enumerate/1 should not match /acquire/:path/:previous
            const res = await fetch(`http://${address}:${port}/enumerate/1`, {
                method: 'POST',
            });

            expect(res.status).toEqual(404);
            expect(enumerateHandler).not.toHaveBeenCalled();
            expect(acquireHandler).not.toHaveBeenCalled();
        });

        test('root route does not match non-root paths', async () => {
            const rootHandler = jest.fn((_request, response) => {
                response.end('root');
            });
            const enumerateHandler = jest.fn((_request, response) => {
                response.end('enumerate');
            });

            // Register both root and specific route
            server.post('/', [rootHandler]);
            server.post('/enumerate', [enumerateHandler]);

            await server.start();
            const { address, port } = server.getServerAddress();

            // Request to /enumerate should match /enumerate route, not /
            const res1 = await fetch(`http://${address}:${port}/enumerate`, {
                method: 'POST',
            });
            expect(res1.status).toEqual(200);
            await expect(res1.text()).resolves.toEqual('enumerate');
            expect(enumerateHandler).toHaveBeenCalled();
            expect(rootHandler).not.toHaveBeenCalled();

            // Request to /xyz should return 404, not match root /
            const res2 = await fetch(`http://${address}:${port}/xyz`, {
                method: 'POST',
            });
            expect(res2.status).toEqual(404);
            expect(rootHandler).not.toHaveBeenCalled();

            // Only explicit request to / should match root
            const res3 = await fetch(`http://${address}:${port}/`, {
                method: 'POST',
            });
            expect(res3.status).toEqual(200);
            await expect(res3.text()).resolves.toEqual('root');
            expect(rootHandler).toHaveBeenCalled();
        });
    });
});
