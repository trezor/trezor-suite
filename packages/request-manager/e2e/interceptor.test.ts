import http from 'http';
import nodeFetch from 'node-fetch';
import path from 'path';
import WebSocket from 'ws';

import { TorController, createInterceptor } from '../src';
import { torRunner } from './torRunner';
import { TorIdentities } from '../src/torIdentities';
import type { InterceptorOptions } from '../src/types';

const hostIp = '127.0.0.1';
const port = 38835;
const controlPort = 35527;
const processId = process.pid;

// 1 minute before timeout, because Tor might be slow to start.
jest.setTimeout(60000);
jest.retryTimes(3, { logErrorsBeforeRetry: true });

// Because tmp/control_auth_cookie is shared by other tests, this test should not run in parallel
// using `--runInBand` option with jest.
const torDataDir = path.join(__dirname, 'tmp');
const ipRegex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

const testGetUrlHttp = 'http://check.torproject.org/';
const testGetUrlHttps = 'https://check.torproject.org/';
const testPostUrlHttps = 'https://httpbingo.org/post';

const conditionalTest = process.env.SKIP_FLAKY_TESTS ? describe.skip : describe;

describe('Interceptor', () => {
    let torProcess: ReturnType<typeof torRunner> | null;
    let torController: TorController;
    let torIdentities: TorIdentities;

    const torSettings = { running: true, host: hostIp, port };
    const fetchImplementations = [
        ['global.fetch', (...args: Parameters<typeof fetch>) => fetch(...args)],
        ['node-fetch', nodeFetch],
    ] as const;

    const extractIp = async (response: { text: () => Promise<string> }) =>
        (await response.text()).match(ipRegex)?.[0];

    const interceptorOptions: InterceptorOptions = {
        getWhitelistedDomains: () => [
            'check.torproject.org',
            'httpbingo.org',
            'tbtc1.trezor.io',
            'localhost',
            '127.0.0.1',
        ],
        handler: () => {},
        getTorSettings: () => torSettings,
    };

    beforeAll(async () => {
        // Callback in createInterceptor should return true in order for the request to use Tor.
        torIdentities = createInterceptor(interceptorOptions).torIdentities;
        // Starting Tor controller to make sure that Tor is running.
        torController = new TorController({
            host: hostIp,
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

    afterEach(async () => {
        await torController.controlPort.closeActiveCircuits();
    });

    // The tests below are somehow useful but their nature is flaky since we can not
    // guarantee that the IPs of 2 different Tor circuits are different. And this is
    // part of the Tor nature.
    conditionalTest('Check if IPs are different', () => {
        const testCases = [
            {
                name: 'HTTP GET',
                url: testGetUrlHttp,
                method: 'GET',
                body: undefined,
            },
            {
                name: 'HTTPS GET',
                url: testGetUrlHttps,
                method: 'GET',
                body: undefined,
            },
            {
                name: 'HTTPS POST',
                url: testPostUrlHttps,
                method: 'POST',
                body: JSON.stringify({ test: 'test' }),
            },
        ];

        describe.each(fetchImplementations)('%s', (_, fetchFn) => {
            it.each(testCases)(
                '$name - Each identity has different ip address',
                async ({ url, method, body }) => {
                    const identityA = await fetchFn(url, {
                        method,
                        body,
                        headers: { 'proxy-authorization': 'Basic default' },
                    });
                    const identityB = await fetchFn(url, {
                        method,
                        body,
                        headers: { 'Proxy-Authorization': 'Basic user' },
                    });

                    const ipA = await extractIp(identityA);
                    const ipB = await extractIp(identityB);

                    expect(ipA).not.toEqual(ipB);
                },
            );

            it(`Reset identity by changing password`, async () => {
                const identityA = await fetchFn(testGetUrlHttps, {
                    headers: { 'Proxy-Authorization': 'Basic user' },
                });
                // Reset existing circuit by changing password
                const identityB = await fetchFn(testGetUrlHttps, {
                    headers: { 'Proxy-Authorization': 'Basic user:password' },
                });
                const ipA = await extractIp(identityA);
                const ipB = await extractIp(identityB);
                expect(ipB).not.toEqual(ipA);
            });
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

    conditionalTest('TorControl', () => {
        it.each(fetchImplementations)('%s closing circuits', async (_label, fetchFn) => {
            await fetchFn(testGetUrlHttps, {
                headers: { 'Proxy-Authorization': 'Basic user-circuit-1' },
            });

            await fetchFn(testGetUrlHttps, {
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
            expect(circuits3.map(c => c.username)).not.toEqual(
                expect.arrayContaining(['user-circuit-1', 'user-circuit-2']),
            );
        });
    });

    // NOTE: the server here is `localhost`, which is whitelisted, so these requests take the DIRECT
    // branch of interceptFetch (originalFetch) and the header restriction is enforced by the
    // socket-level stripping in `interceptNetSocketConnect`, NOT by `buildTorHeaders`. The fetch-path
    // `buildTorHeaders` allow-list + Proxy-Authorization/Allowed-Headers stripping is covered
    // deterministically (no Tor needed) in tests/fetchHeaders.test.ts.
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

        const fetchHeaders = (pr: Promise<any>) => pr.then(r => r.json());

        const headerTestCases = [
            {
                method: 'POST',
                body: JSON.stringify({ test: 'test' }),
                defaultHeaders: { 'User-Agent': 'TrezorSuite' },
                expectedDefault: {
                    accept: '*/*',
                    'content-length': '15',
                    'content-type': 'text/plain;charset=UTF-8',
                    'user-agent': 'TrezorSuite',
                },
                allowedHeaders: 'AcCePt-EnCoDiNg;content-type;Content-Length;HOST', // case insensitive
                expectedRestricted: {
                    'content-length': '15',
                    'content-type': 'text/plain;charset=UTF-8',
                },
            },
            {
                method: 'GET',
                body: undefined,
                defaultHeaders: { 'User-Agent': 'TrezorSuite' },
                expectedDefault: {
                    accept: '*/*',
                    'user-agent': 'TrezorSuite',
                },
                allowedHeaders: 'Accept-Encoding;Content-Type;Content-Length;Host',
                expectedRestricted: {},
            },
        ];

        describe.each(fetchImplementations)('%s', (_, fetchFn) => {
            it.each(headerTestCases)(
                '$method request headers',
                async ({
                    method,
                    body,
                    defaultHeaders,
                    expectedDefault,
                    allowedHeaders,
                    expectedRestricted,
                }) => {
                    const { serverUrl, host } = serverInit;

                    // default headers
                    await expect(
                        fetchHeaders(
                            fetchFn(serverUrl, {
                                method,
                                body,
                                headers: defaultHeaders,
                            }),
                        ),
                    ).resolves.toEqual(expect.objectContaining({ host, ...expectedDefault }));

                    // restricted headers
                    await expect(
                        fetchHeaders(
                            fetchFn(serverUrl, {
                                method,
                                body,
                                headers: {
                                    ...defaultHeaders,
                                    'Allowed-Headers': allowedHeaders,
                                },
                            }),
                        ),
                    ).resolves.toEqual(expect.objectContaining({ host, ...expectedRestricted }));
                },
            );
        });
    });

    it.each(fetchImplementations)('%s Block unauthorized requests', async (_, fetchFn) => {
        torSettings.running = false;

        await expect(
            fetchFn(testPostUrlHttps, {
                method: 'POST',
                body: JSON.stringify({ test: 'test' }),
                headers: { 'Proxy-Authorization': 'Basic default' },
            }),
        ).rejects.toThrow('Blocked request with Proxy-Authorization. TOR not enabled.');
    });
});
