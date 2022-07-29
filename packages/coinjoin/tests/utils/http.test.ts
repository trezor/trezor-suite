import { coordinatorRequest } from '../../src/utils/http';
import { createServer, Server } from '../mocks/server';

let server: Server | undefined;
let baseUrl = 'http://localhost:8081/';

describe('http', () => {
    beforeAll(async () => {
        server = await createServer();
        baseUrl = server.requestOptions.coordinatorUrl;
    });

    beforeEach(() => {
        server?.removeAllListeners('test-handle-request');
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('with 500 error', async () => {
        server?.addListener('test-request', (_, req, res) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify({ errorCode: 'InternalErrorCodeExample' }));
            res.end();
            req.emit('test-response');
        });

        await expect(coordinatorRequest('status', {}, { baseUrl })).rejects.toThrow(
            'InternalErrorCodeExample',
        );
    });

    it('with 500 error without errorCode', async () => {
        server?.addListener('test-request', (_, req, res) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify({ error: 'InternalErrorCodeExample' }));
            res.end();
            req.emit('test-response');
        });

        await expect(coordinatorRequest('status', {}, { baseUrl })).rejects.toThrow(
            JSON.stringify({ error: 'InternalErrorCodeExample' }),
        );
    });

    it('with 500 error without json header', async () => {
        server?.addListener('test-request', (_, req, res) => {
            res.statusCode = 500;
            res.write('InternalErrorCodeExample');
            res.end();
            req.emit('test-response');
        });

        await expect(coordinatorRequest('status', {}, { baseUrl })).rejects.toThrow(
            'Internal Server Error: InternalErrorCodeExample',
        );
    });

    it('with 500 error with invalid json', async () => {
        server?.addListener('test-request', (_, req, res) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.write('InternalErrorCodeExample');
            res.end();
            req.emit('test-response');
        });

        await expect(coordinatorRequest('status', {}, { baseUrl })).rejects.toThrow(
            'Unexpected token',
        );
    });

    it('with 404 error', async () => {
        server?.addListener('test-request', (_, req, res) => {
            res.statusCode = 404;
            res.end();
            req.emit('test-response');
        });

        await expect(coordinatorRequest('status', {}, { baseUrl })).rejects.toThrow('Not Found');
    });

    it('aborted request', async () => {
        const abort = new AbortController();
        abort.abort();

        await expect(
            coordinatorRequest('status', {}, { baseUrl, signal: abort.signal }),
        ).rejects.toThrow('The user aborted a request');
    });

    it('aborted delayed request', async () => {
        const abort = new AbortController();
        setTimeout(() => abort.abort(), 300);
        await expect(
            coordinatorRequest('status', {}, { baseUrl, delay: 1000, signal: abort.signal }),
        ).rejects.toThrow('The user aborted a request.');
    });

    it('successful', done => {
        coordinatorRequest('input-registration', {}, { baseUrl }).then(resp => {
            expect(resp).toMatchObject({ aliceId: expect.any(String) });
        });
        // without baseUrl
        coordinatorRequest(`${baseUrl}status`, {}).then(resp => {
            expect(resp).toEqual({ roundStates: [] });
        });
        // without json response
        coordinatorRequest('ready-to-sign', {}, { baseUrl, parseJson: false }).then(resp => {
            expect(resp).toEqual('{}');
            done();
        });
    });

    it('with identity', async () => {
        const requestListener = jest.fn(req => {
            expect(req.headers).toMatchObject({
                'proxy-authorization': 'Basic abcd',
            });
        });
        server?.addListener('test-handle-request', requestListener);
        await coordinatorRequest('status', {}, { baseUrl, identity: 'abcd' });
    });
});
