import { promises as fs } from 'fs';
import * as http from 'http';
import os from 'os';
import path from 'path';

import { Logger } from './logger';
import {
    RENDERER_TOKEN_COOKIE,
    type RendererServer,
    createRendererServer,
    resolveFilePath,
} from './renderer-server';

const logger = new Logger('mute');
const token = 'per-launch-token';

type RequestParams = {
    port: number;
    pathname: string;
    method?: string;
    host?: string;
    cookie?: string;
};

type ResponseInfo = {
    status: number;
    headers: http.IncomingHttpHeaders;
    body: string;
};

const request = ({
    port,
    pathname,
    method = 'GET',
    host = `localhost:${port}`,
    cookie = `${RENDERER_TOKEN_COOKIE}=${token}`,
}: RequestParams) =>
    new Promise<ResponseInfo>((resolve, reject) => {
        const clientRequest = http.request(
            { host: '127.0.0.1', port, path: pathname, method, headers: { host, cookie } },
            response => {
                let body = '';
                response.setEncoding('utf8');
                response.on('data', chunk => {
                    body += chunk;
                });
                response.on('end', () =>
                    resolve({ status: response.statusCode ?? 0, headers: response.headers, body }),
                );
            },
        );
        clientRequest.on('error', reject);
        clientRequest.end();
    });

describe('resolveFilePath', () => {
    const rootDir = path.join(path.sep, 'app', 'build');

    it.each([
        ['/', path.join(rootDir, 'index.html')],
        ['/static/app.js', path.join(rootDir, 'static', 'app.js')],
        ['/static/with%20space.js', path.join(rootDir, 'static', 'with space.js')],
        ['//etc/passwd', path.join(rootDir, 'etc', 'passwd')],
    ])('resolves %s inside the build', (urlPathname, expected) => {
        expect(resolveFilePath({ rootDir, urlPathname })).toBe(expected);
    });

    it.each(['/../secret.txt', '/%2e%2e/secret.txt', '/static/%2e%2e/%2e%2e/secret.txt', '/.'])(
        'rejects %s',
        urlPathname => {
            expect(resolveFilePath({ rootDir, urlPathname })).toBeUndefined();
        },
    );

    it('rejects a null byte and a malformed escape', () => {
        expect(resolveFilePath({ rootDir, urlPathname: '/index.html%00.js' })).toBeUndefined();
        expect(resolveFilePath({ rootDir, urlPathname: '/%E0%A4%A' })).toBeUndefined();
    });
});

describe('createRendererServer', () => {
    let tempDir: string;
    let rootDir: string;
    let server: RendererServer;
    let port: number;

    beforeAll(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'renderer-server-'));
        rootDir = path.join(tempDir, 'build');
        await fs.mkdir(path.join(rootDir, 'static'), { recursive: true });
        await fs.writeFile(path.join(rootDir, 'index.html'), '<!doctype html><title>Suite</title>');
        await fs.writeFile(path.join(rootDir, 'static', 'app.js'), 'console.log(1);');
        await fs.writeFile(path.join(tempDir, 'secret.txt'), 'outside');

        server = createRendererServer({ rootDir, port: 0, token, logger });
        const startResult = await server.start();
        if (!startResult.success) {
            throw new Error(startResult.error);
        }
        port = Number(new URL(startResult.payload).port);
    });

    afterAll(async () => {
        await server.stop();
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('reports a localhost origin', async () => {
        const otherServer = createRendererServer({ rootDir, port: 0, token, logger });
        const startResult = await otherServer.start();
        await otherServer.stop();

        expect(startResult.success).toBe(true);
        if (startResult.success) {
            expect(startResult.payload).toMatch(/^http:\/\/localhost:\d+$/);
        }
    });

    it('serves index.html at the root', async () => {
        const response = await request({ port, pathname: '/' });

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
        expect(response.headers['cache-control']).toBe('no-store');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.body).toContain('<title>Suite</title>');
    });

    it('serves a nested asset with its media type', async () => {
        const response = await request({ port, pathname: '/static/app.js?v=1' });

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('text/javascript; charset=utf-8');
        expect(response.body).toBe('console.log(1);');
    });

    it('answers HEAD with headers only', async () => {
        const response = await request({ port, pathname: '/', method: 'HEAD' });

        expect(response.status).toBe(200);
        expect(response.headers['content-length']).toBe('35');
        expect(response.body).toBe('');
    });

    it('rejects a request without the token cookie', async () => {
        const response = await request({ port, pathname: '/', cookie: '' });

        expect(response.status).toBe(403);
    });

    it('rejects a request with another token', async () => {
        const response = await request({
            port,
            pathname: '/',
            cookie: `${RENDERER_TOKEN_COOKIE}=${token}x`,
        });

        expect(response.status).toBe(403);
    });

    it('rejects a request for another host', async () => {
        const response = await request({ port, pathname: '/', host: `127.0.0.1:${port}` });

        expect(response.status).toBe(403);
    });

    it('rejects a method other than GET and HEAD', async () => {
        const response = await request({ port, pathname: '/', method: 'POST' });

        expect(response.status).toBe(405);
    });

    it('rejects a path that escapes the build', async () => {
        const response = await request({ port, pathname: '/%2e%2e/secret.txt' });

        expect(response.status).toBe(403);
    });

    it('returns 404 for a missing file and for a directory', async () => {
        const missing = await request({ port, pathname: '/missing.js' });
        const directory = await request({ port, pathname: '/static' });

        expect(missing.status).toBe(404);
        expect(directory.status).toBe(404);
    });

    it('fails to start on a port that is taken', async () => {
        const otherServer = createRendererServer({ rootDir, port, token, logger });
        const startResult = await otherServer.start();

        expect(startResult.success).toBe(false);
        if (!startResult.success) {
            expect(startResult.error).toContain('EADDRINUSE');
        }
    });
});
