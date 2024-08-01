import {
    HttpServer,
    parseBodyJSON,
    parseBodyText,
    allowReferers,
    RequestHandler,
    ParamsValidatorHandler,
} from '../http';

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
            // @ts-expect-error
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
        // @ts-expect-error
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

        const post = (url: string, body: any) => {
            return fetch(`http://${address}:${port}/${url}`, {
                method: 'POST',
                body: body ? JSON.stringify(body) : undefined,
            });
        };

        let res;
        res = await post('foo-1/321', { foo: 'bar' }); // body != array, fails in bodyValidator
        expect(res.status).toEqual(400);
        expect(await res.json()).toEqual({ error: 'Invalid body' });

        res = await post('foo-1/321', undefined); // body != array, fails in parseBodyJSON
        expect(res.status).toEqual(400);
        const { error } = await res.json();
        expect(error).toMatch('Invalid json body:');

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
});
