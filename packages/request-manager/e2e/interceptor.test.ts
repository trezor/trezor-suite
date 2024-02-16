import path from 'path';
import http from 'http';
import WebSocket from 'ws';

import { TorController, createInterceptor } from '../src';
import { torRunner } from './torRunner';
import { TorIdentities } from '../src/torIdentities';

const host = '127.0.0.1';
const port = 38835;
const controlPort = 35527;
const processId = process.pid;

// 1 minute before timeout, because Tor might be slow to start.
jest.setTimeout(60000);

// Because tmp/control_auth_cookie is shared by other tests, this test should not run in parallel
// using `--runInBand` option with jest.
const torDataDir = path.join(__dirname, 'tmp');
const ipRegex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

const testGetUrlHttp = 'http://check.torproject.org/';
const testGetUrlHttps = 'https://check.torproject.org/';
const testPostUrlHttps = 'https://httpbin.org/post';

describe('Interceptor', () => {
    let torProcess: ReturnType<typeof torRunner> | null;
    let torController: TorController;
    let torIdentities: TorIdentities;

    const torSettings = { running: true, host, port };

    const INTERCEPTOR = {
        handler: () => {},
        getTorSettings: () => torSettings,
    };

    beforeAll(async () => {
        // Callback in in createInterceptor should return true in order for the request to use Tor.
        torIdentities = createInterceptor(INTERCEPTOR).torIdentities;
        // Starting Tor controller to make sure that Tor is running.
        torController = new TorController({
            host,
            port,
            controlPort,
            torDataDir,
        });
        const torParams = torController.getTorConfiguration(processId);
        // Starting Tor process from binary.
        torProcess = torRunner({
            torParams,
        });

        // Waiting for Tor to be ready to accept successful connections.
        await torController.waitUntilAlive();
    });

    afterAll(async () => {
        if (torProcess) {
            await torProcess.kill();
            torProcess = null;
        }
    });

    describe('GET method', () => {
        it('HTTP - When no identity is provided, default identity is used', async () => {
            const identityDefault = await fetch(testGetUrlHttp, {
                headers: { 'Proxy-Authorization': 'Basic default' },
            });
            const identityDefault2 = await fetch(testGetUrlHttp);
            const iPIdentitieA = ((await identityDefault.text()) as any).match(ipRegex)[0];
            const iPIdentitieA2 = ((await identityDefault2.text()) as any).match(ipRegex)[0];
            expect(iPIdentitieA).toEqual(iPIdentitieA2);
        });

        it('HTTPS - When no identity is provided, default identity is used', async () => {
            const identityDefault = await fetch(testGetUrlHttps, {
                headers: { 'Proxy-Authorization': 'Basic default' },
            });
            const identityDefault2 = await fetch(testGetUrlHttps);
            const iPIdentitieA = ((await identityDefault.text()) as any).match(ipRegex)[0];
            const iPIdentitieA2 = ((await identityDefault2.text()) as any).match(ipRegex)[0];
            expect(iPIdentitieA).toEqual(iPIdentitieA2);
        });

        it('HTTPS - Each identity has different ip address', async () => {
            const identityA = await fetch(testGetUrlHttps, {
                headers: { 'Proxy-Authorization': 'Basic default' },
            });
            const identityB = await fetch(testGetUrlHttps, {
                headers: { 'Proxy-Authorization': 'Basic user' },
            });
            const identityA2 = await fetch(testGetUrlHttps, {
                headers: { 'Proxy-Authorization': 'Basic default' },
            });
            // Parsing IP address from html provided by check.torproject.org.
            const iPIdentitieA = ((await identityA.text()) as any).match(ipRegex)[0];
            const iPIdentitieB = ((await identityB.text()) as any).match(ipRegex)[0];
            const iPIdentitieA2 = ((await identityA2.text()) as any).match(ipRegex)[0];
            // Check if identities are the same when using same identity.
            expect(iPIdentitieA).toEqual(iPIdentitieA2);
            // Check if identities are different when using different identity.
            expect(iPIdentitieA).not.toEqual(iPIdentitieB);

            // reset existing circuit using identity with password
            const identityB2 = await fetch(testGetUrlHttps, {
                headers: { 'Proxy-Authorization': 'Basic user:password' },
            });
            const iPIdentitieB2 = ((await identityB2.text()) as any).match(ipRegex)[0];
            // ip for "user" did change
            expect(iPIdentitieB2).not.toEqual(iPIdentitieB);
            // continue using new circuit
            const identityB3 = await fetch(testGetUrlHttps, {
                headers: { 'Proxy-Authorization': 'Basic user' },
            });
            const iPIdentitieB3 = ((await identityB3.text()) as any).match(ipRegex)[0];
            // same ip after change
            expect(iPIdentitieB3).toEqual(iPIdentitieB2);
        });
    });

    describe('POST method', () => {
        it('HTTPS - Each identity has different ip address', async () => {
            const identityA = await fetch(testPostUrlHttps, {
                method: 'POST',
                body: JSON.stringify({ test: 'test' }),
                headers: { 'Proxy-Authorization': 'Basic default' },
            });
            const identityB = await fetch(testPostUrlHttps, {
                method: 'POST',
                body: JSON.stringify({ test: 'test' }),
                headers: { 'Proxy-Authorization': 'Basic user' },
            });
            const identityA2 = await fetch(testPostUrlHttps, {
                method: 'POST',
                body: JSON.stringify({ test: 'test' }),
                headers: { 'Proxy-Authorization': 'Basic default' },
            });

            const iPIdentitieA = ((await identityA.json()) as any).origin;
            const iPIdentitieB = ((await identityB.json()) as any).origin;
            const iPIdentitieA2 = ((await identityA2.json()) as any).origin;

            // Check if identities are the same when using same identity.
            expect(iPIdentitieA).toEqual(iPIdentitieA2);
            // Check if identities are different when using different identity.
            expect(iPIdentitieA).not.toEqual(iPIdentitieB);
        });
    });

    describe('WebSocket', () => {
        const createWebSocket = (options: any = {}) =>
            new Promise<void>((resolve, reject) => {
                const ws = new WebSocket('wss://tbtc1.trezor.io/websocket', {
                    headers: {
                        'User-Agent': 'Trezor Suite',
                        ...options,
                    },
                });
                ws.on('open', () => {
                    ws.close();
                    resolve();
                });
                ws.on('error', reject);
            });

        it('WebSocket - Each connection creates new identity', async () => {
            await createWebSocket();
            await createWebSocket();

            const identities = Object.keys((torIdentities as any).identities).filter(name =>
                name.includes('WebSocket'),
            );

            expect(identities.length).toBe(2);
        });

        it('WebSocket - Using Proxy-Authorization header', async () => {
            await createWebSocket({
                'Proxy-Authorization': 'Basic WebSocket-Identity',
            });
            await createWebSocket({
                'Proxy-Authorization': 'Basic WebSocket-Identity',
            });

            const identities = Object.keys((torIdentities as any).identities).filter(name =>
                name.includes('WebSocket-Identity'),
            );

            expect(identities.length).toBe(1);
        });
    });

    describe('TorControl', () => {
        it('closing circuits', async () => {
            await fetch(testGetUrlHttps, {
                headers: { 'Proxy-Authorization': 'Basic user-circuit-1' },
            });

            await fetch(testGetUrlHttps, {
                headers: { 'Proxy-Authorization': 'Basic user-circuit-2' },
            });

            const circuits1 = await torController.controlPort.getCircuits();
            // there should be at least 2 circuits
            expect(circuits1.length).toBeGreaterThanOrEqual(2);
            // there should be circuits with requested username
            expect(circuits1.map(c => c.username)).toEqual(
                expect.arrayContaining(['user-circuit-1', 'user-circuit-2']),
            );

            // close specific circuit
            await torController.controlPort.closeCircuit('user-circuit-1');

            // and validate state afterward
            const circuits2 = await torController.controlPort.getCircuits();
            expect(circuits2.map(c => c.username)).not.toEqual(
                expect.arrayContaining(['user-circuit-1']),
            );
            expect(circuits2.map(c => c.username)).toEqual(
                expect.arrayContaining(['user-circuit-2']),
            );

            // close remaining circuits
            await torController.controlPort.closeActiveCircuits();

            // and validate state afterward
            const circuits3 = await torController.controlPort.getCircuits();
            expect(circuits3.length).toEqual(0);
        });
    });

    describe('Allowed-Headers', () => {
        // create simple http server and respond with received headers
        const createHttpServer = () =>
            new Promise<{ server: http.Server; serverUrl: string; host: string }>(
                (resolve, reject) => {
                    const server = http.createServer((request, response) => {
                        response.setHeader('Content-Type', 'application/json');
                        response.write(JSON.stringify(request.headers));
                        response.end();
                    });
                    server.unref();
                    server.on('error', reject);
                    server.listen(0, () => {
                        const addr = server.address() as any; // as net.AddressInfo
                        resolve({
                            server,
                            serverUrl: `http://localhost:${addr.port}`,
                            host: `localhost:${addr.port}`,
                        });
                    });
                },
            );

        let serverInit: Awaited<ReturnType<typeof createHttpServer>>;
        beforeAll(async () => {
            serverInit = await createHttpServer();
        });

        afterAll(() => new Promise(resolve => serverInit.server.close(resolve)));

        const fetchHeaders = (url: string, options: RequestInit) =>
            fetch(url, options).then(r => r.json());

        it('POST request headers', async () => {
            const { serverUrl, host } = serverInit;

            // default headers
            await expect(
                fetchHeaders(serverUrl, {
                    method: 'POST',
                    body: JSON.stringify({ test: 'test' }),
                    headers: { 'User-Agent': 'TrezorSuite' },
                }),
            ).resolves.toEqual({
                host,
                accept: '*/*',
                'accept-encoding': 'gzip,deflate',
                connection: 'close',
                'content-length': '15',
                'content-type': 'text/plain;charset=UTF-8',
                'user-agent': 'TrezorSuite',
            });

            // restricted headers
            await expect(
                fetchHeaders(serverUrl, {
                    method: 'POST',
                    body: JSON.stringify({ test: 'test' }),
                    headers: {
                        'User-Agent': 'TrezorSuite',
                        'Allowed-Headers': 'AcCePt-EnCoDiNg;content-type;Content-Length;HOST', // case insensitive
                    },
                }),
            ).resolves.toEqual({
                host,
                'accept-encoding': 'gzip,deflate',
                'content-length': '15',
                'content-type': 'text/plain;charset=UTF-8',
            });
        });

        it('GET request headers', async () => {
            const { serverUrl, host } = serverInit;

            // default headers
            await expect(
                fetchHeaders(serverUrl, {
                    method: 'GET',
                    headers: { 'User-Agent': 'TrezorSuite' },
                }),
            ).resolves.toEqual({
                host,
                accept: '*/*',
                'accept-encoding': 'gzip,deflate',
                connection: 'close',
                'user-agent': 'TrezorSuite',
            });

            // restricted headers
            await expect(
                fetchHeaders(serverUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'TrezorSuite',
                        'Allowed-Headers': 'Accept-Encoding;Content-Type;Content-Length;Host',
                    },
                }),
            ).resolves.toEqual({
                host,
                'accept-encoding': 'gzip,deflate',
            });
        });
    });

    it('Block unauthorized requests', async () => {
        torSettings.running = false;

        await expect(
            fetch(testPostUrlHttps, {
                method: 'POST',
                body: JSON.stringify({ test: 'test' }),
                headers: { 'Proxy-Authorization': 'Basic default' },
            }),
        ).rejects.toThrow('Blocked request with Proxy-Authorization');
    });
});
