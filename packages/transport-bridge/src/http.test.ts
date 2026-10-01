import EventEmitter from 'events';
import http from 'http';

import { getFreePort } from '@trezor/node-utils';
import { UdpApi } from '@trezor/transport/src/api/udp';
import { type AbstractApi, type AbstractApiArgs, bridgeApiCall } from '@trezor/transport-common';
import { resolveAfter } from '@trezor/utils';

import { TrezordNode } from './http';

const muteLogger = {
    info: (..._args: string[]) => {},
    debug: (..._args: string[]) => {},
    log: (..._args: string[]) => {},
    warn: (..._args: string[]) => {},
    error: (..._args: string[]) => {},
};

// duplicated DeviceList.test.ts
const waitForNthEventOfType = (
    emitter: { on: (...args: any[]) => any },
    type: string,
    number: number,
) =>
    // wait for all device-connect events
    new Promise<void>(resolve => {
        let i = 0;
        emitter.on(type, () => {
            if (++i === number) {
                resolve();
            }
        });
    });
// todo: Szymon is about to re-use this from a single file
const createTransportApi = (override = {}) => {
    const api = new UdpApi({ logger: muteLogger });

    return {
        ...api,
        chunkSize: 0,
        enumerate: () => Promise.resolve({ success: true, payload: [{ path: '1' }] }),
        on: () => {},
        off: () => {},
        openDevice: (path: string) => Promise.resolve({ success: true, payload: [{ path }] }),
        closeDevice: () => Promise.resolve({ success: true }),
        write: () => Promise.resolve({ success: true }),
        read: () =>
            Promise.resolve({
                success: true,
                payload: Buffer.from('3f232300110000000c1002180020006000aa010154', 'hex'), // partial proto.Features
                // payload: Buffer.from('3f23230002000000060a046d656f77', 'hex'), // proto.Success
            }),
        dispose: () => {},
        listen: () => {},

        ...override,
    } as unknown as AbstractApi;
};

const createTrezordNode = (
    constructorParams?: Partial<ConstructorParameters<typeof TrezordNode>[0]>,
    apiOverride?: any,
) =>
    new TrezordNode({
        api: createTransportApi(apiOverride),
        // @ts-expect-error
        logger: muteLogger,
        ...constructorParams,
    });

describe('http', () => {
    let port: number;
    beforeAll(async () => {
        const ports = await getFreePort();
        port = ports[0] ?? 0;
    });

    (['usb', 'udp'] as const).forEach(api => {
        it(`node bridge using ${api} api should start and stop without stopping jest from exiting`, async () => {
            const trezordNode = createTrezordNode({ port });
            await trezordNode.start();
            await trezordNode.stop();
        });
    });

    it('constructor accepts custom AbstractApi', () => {
        new TrezordNode({
            port,
            api: createTransportApi(),
            // @ts-expect-error
            logger: muteLogger,
        });
    });

    it('stop should make previously used port available again', async () => {
        const trezordNode = createTrezordNode({ port });
        await trezordNode.start();
        await trezordNode.stop();
        const anotherInstance = new TrezordNode({
            port,
            api: createTransportApi(),
            // @ts-expect-error
            logger: muteLogger,
        });
        await anotherInstance.start();
        await anotherInstance.stop();
    });

    describe('BridgeProtocolMessage', () => {
        const GET_FEATURES = '000000000000'; // Initialize message-in
        const FEATURES = '00110000000c1002180020006000aa010154'; // Features message-out

        const setupTrezordNode = async (params?: Parameters<typeof createTrezordNode>[0]) => {
            const trezordNode = createTrezordNode({
                port: (await getFreePort())[0],
                ...params,
            });
            await trezordNode.start();
            const url = trezordNode.server[0]!.getRouteAddress('/') || '/';

            await bridgeApiCall({
                url: `${url}enumerate`,
                method: 'POST',
            });
            await bridgeApiCall({
                url: `${url}acquire/1/null`,
                method: 'POST',
            });

            return { trezordNode, url };
        };

        it('POST / getInfo', async () => {
            const { trezordNode, url } = await setupTrezordNode();
            const response = await bridgeApiCall({
                url,
                method: 'POST',
            });
            if (!response.success) {
                throw new Error(response.error.code + ' ' + response.error.message);
            }
            expect(response.payload).toMatchObject({
                version: trezordNode.version,
            });
            await trezordNode.stop();
        });

        it('/call protocolMessage validation', async () => {
            const { trezordNode, url } = await setupTrezordNode();

            let res;
            // raw body without a protocol envelope is rejected (legacy hex format dropped)
            res = await bridgeApiCall({
                url: `${url}call/1`,
                method: 'POST',
                body: GET_FEATURES,
            });
            expect(res.success).toBe(false);
            res = await bridgeApiCall({
                url: `${url}call/1`,
                method: 'POST',
                body: 'not a hex',
            });
            expect(res.success).toBe(false);

            // protocol bridge, json response without magic header
            res = await bridgeApiCall({
                url: `${url}call/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'bridge', data: GET_FEATURES }),
            });
            if (!res.success) {
                throw new Error(res.error.code + ' ' + res.error.message);
            }
            expect(res.payload).toEqual({
                protocol: 'bridge',
                data: FEATURES,
            });

            // protocol v1, json response with magic header
            res = await bridgeApiCall({
                url: `${url}call/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'v1', data: '3f2323' + GET_FEATURES }),
            });
            if (!res.success) {
                throw new Error(res.error.code);
            }
            expect(res.payload).toEqual({
                protocol: 'v1',
                data: '3f2323' + FEATURES,
            });

            // invalid protocol name (protocol v0)
            res = await bridgeApiCall({
                url: `${url}call/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'v0', message: '00' }),
            });
            expect(res.success).toBe(false);

            // invalid protocol message (not a hex)
            res = await bridgeApiCall({
                url: `${url}call/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'v1', message: 'not a hex' }),
            });
            expect(res.success).toBe(false);

            // invalid protocol message (malformed json)
            res = await bridgeApiCall({
                url: `${url}call/1`,
                method: 'POST',
                body: '',
            });
            expect(res.success).toBe(false);
            res = await bridgeApiCall({
                url: `${url}call/1`,
                method: 'POST',
            });
            expect(res.success).toBe(false);
            res = await bridgeApiCall({
                url: `${url}call/1`,
                method: 'POST',
                // @ts-expect-error
                body: null,
            });
            expect(res.success).toBe(false);

            await trezordNode.stop();
        });

        it('/post protocolMessage validation', async () => {
            const { trezordNode, url } = await setupTrezordNode();

            let res;
            // raw body without a protocol envelope is rejected (legacy hex format dropped)
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                body: GET_FEATURES,
            });
            expect(res.success).toBe(false);
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                body: 'not a hex',
            });
            expect(res.success).toBe(false);

            // protocol bridge, json response without magic header
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'bridge', data: GET_FEATURES }),
            });
            if (!res.success) {
                throw new Error(res.error.code + ' ' + res.error.message);
            }
            expect(res.payload).toEqual({
                protocol: 'bridge',
                data: '',
            });

            // protocol v1, json response with magic header
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'v1', data: '3f2323' + GET_FEATURES }),
            });
            if (!res.success) {
                throw new Error(res.error.code + ' ' + res.error.message);
            }
            expect(res.payload).toEqual({
                protocol: 'v1',
                data: '',
            });

            // invalid protocol name (protocol v0)
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'v0', data: '00' }),
            });
            expect(res).toMatchObject({
                success: false,
                error: {
                    code: 'unexpected error',
                    message: 'Invalid BridgeProtocolMessage protocol',
                },
            });

            // invalid protocol message (not a hex)
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'v1', data: 'not a hex' }),
            });
            expect(res).toMatchObject({
                success: false,
                error: { message: 'Invalid BridgeProtocolMessage data' },
            });

            // invalid protocol message (malformed json)
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                body: '',
            });
            expect(res).toMatchObject({
                success: false,
                error: { message: 'Invalid BridgeProtocolMessage body' },
            });
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
            });
            expect(res).toMatchObject({
                success: false,
                error: { message: 'Invalid BridgeProtocolMessage body' },
            });
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                // @ts-expect-error
                body: null,
            });
            expect(res).toMatchObject({
                success: false,
                error: { message: 'Invalid BridgeProtocolMessage body' },
            });

            await trezordNode.stop();
        });

        it('/read protocolMessage validation', async () => {
            const { trezordNode, url } = await setupTrezordNode();

            let res;
            // raw body without a protocol envelope is rejected (legacy hex format dropped)
            res = await bridgeApiCall({
                url: `${url}read/1`,
                method: 'POST',
            });
            expect(res.success).toBe(false);

            // protocol bridge, json response without magic header
            res = await bridgeApiCall({
                url: `${url}read/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'bridge' }),
            });
            if (!res.success) {
                throw new Error(res.error.code + ' ' + res.error.message);
            }
            expect(res.payload).toEqual({
                protocol: 'bridge',
                data: FEATURES,
            });

            // protocol v1, json response with magic header
            res = await bridgeApiCall({
                url: `${url}read/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'v1' }),
            });
            if (!res.success) {
                throw new Error(res.error.code + ' ' + res.error.message);
            }
            expect(res.payload).toEqual({
                protocol: 'v1',
                data: '3f2323' + FEATURES,
            });

            // invalid protocol name (protocol v0)
            res = await bridgeApiCall({
                url: `${url}read/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'v0' }),
            });
            expect(res.success).toBe(false);

            await trezordNode.stop();
        });

        it('protocol bridge responses carry the deprecation headers', async () => {
            const { trezordNode, url } = await setupTrezordNode();

            // bridgeApiCall discards response headers, so talk to the server directly.
            // http.request rather than fetch: fetch's connection pool keeps jest from exiting.
            const post = (
                endpoint: string,
                body: Record<string, unknown>,
                headers: Record<string, string> = {},
            ) =>
                new Promise<{ status?: number; headers: http.IncomingHttpHeaders }>(
                    (resolve, reject) => {
                        const req = http.request(
                            `${url}${endpoint}/1`,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Connection: 'close',
                                    ...headers,
                                },
                            },
                            res => {
                                res.resume();
                                res.on('end', () =>
                                    resolve({ status: res.statusCode, headers: res.headers }),
                                );
                            },
                        );
                        req.on('error', reject);
                        req.end(JSON.stringify(body));
                    },
                );

            const DEPRECATION = '@1790812800';
            const LINK =
                '<https://github.com/trezor/trezor-suite/issues/23794>; rel="deprecation"; type="text/html"';

            const deprecated = [
                await post('call', { protocol: 'bridge', data: GET_FEATURES }),
                await post('post', { protocol: 'bridge', data: GET_FEATURES }),
                await post('read', { protocol: 'bridge' }),
            ];
            deprecated.forEach(res => {
                // behaviour is unchanged, the request still succeeds
                expect(res.status).toBe(200);
                expect(res.headers.deprecation).toBe(DEPRECATION);
                expect(res.headers.link).toBe(LINK);
            });

            // the requests above carry no Origin, a browser-origin client additionally needs
            // both header names in Access-Control-Expose-Headers to be able to read them
            const fromBrowserOrigin = await post(
                'call',
                { protocol: 'bridge', data: GET_FEATURES },
                { Origin: 'https://trezor.io' },
            );
            expect(fromBrowserOrigin.headers.deprecation).toBe(DEPRECATION);
            expect(fromBrowserOrigin.headers.link).toBe(LINK);
            expect(fromBrowserOrigin.headers['access-control-expose-headers']).toBe(
                'Deprecation, Link',
            );

            const supportedV1 = [
                await post('call', { protocol: 'v1', data: '3f2323' + GET_FEATURES }),
                await post('post', { protocol: 'v1', data: '3f2323' + GET_FEATURES }),
                await post('read', { protocol: 'v1' }),
            ];
            expect(supportedV1.map(res => res.status)).toEqual([200, 200, 200]);

            // v2 is rejected further down by core for the missing `thpState` this test does
            // not set up; the middleware under test has already run by then
            const supportedV2 = await post('post', { protocol: 'v2', data: '0412380000' });

            const supported = [...supportedV1, supportedV2];
            supported.forEach(res => {
                expect(res.headers.deprecation).toBe(undefined);
                expect(res.headers.link).toBe(undefined);
            });

            // RFC 8594 would require a removal date; none is being committed to
            [...deprecated, ...supported].forEach(res => {
                expect(res.headers.sunset).toBe(undefined);
            });

            await trezordNode.stop();
        });
    });

    describe('endpoints', () => {
        ['GET /', 'GET /status'].forEach(endpoint => {
            it(endpoint, async () => {
                const trezordNode = new TrezordNode({
                    port,
                    api: createTransportApi(),
                    // @ts-expect-error
                    logger: muteLogger,
                });
                await trezordNode.start();

                await new Promise(resolve => setTimeout(resolve, 1000));

                const url = trezordNode.server[0]!.getRouteAddress('/') || '/';
                const response = await bridgeApiCall({
                    url,
                    method: 'GET',
                });
                if (!response.success) {
                    throw new Error(response.error.code);
                }
                expect(response.payload).toContain('<html');

                await trezordNode.stop();
            });
        });

        it('POST /acquire with body', async () => {
            const trezordNode = new TrezordNode({
                port,
                api: createTransportApi(),
                // @ts-expect-error
                logger: muteLogger,
            });
            await trezordNode.start();

            await new Promise(resolve => setTimeout(resolve, 1000));

            const url = trezordNode.server[0]!.getRouteAddress('/') || '/';

            await bridgeApiCall({
                url: url + 'enumerate',
                method: 'POST',
            });

            const response = await bridgeApiCall({
                url: url + 'acquire/1/null',
                method: 'POST',
                body: {
                    sessionOwner: 'app A',
                },
            });
            expect(response.success).toBe(true);

            const enumerateRes = await bridgeApiCall({
                url: url + 'enumerate',
                method: 'POST',
            });

            expect(enumerateRes).toMatchObject({
                success: true,
                payload: [{ path: '1', session: '1', sessionOwner: 'app A' }],
            });

            await trezordNode.stop();
        });

        it('POST /', async () => {
            const trezordNode = createTrezordNode({ port });
            await trezordNode.start();

            await new Promise(resolve => setTimeout(resolve, 1000));

            const url = trezordNode.server[0]!.getRouteAddress('/')!;
            const response = await bridgeApiCall({
                url,
                method: 'POST',
            });
            if (!response.success) {
                throw new Error(response.error.code);
            }
            expect(response.payload).toMatchObject({
                version: trezordNode.version,
                // legacy field used by released Suite clients to choose wire format; see http.ts
                protocolMessages: true,
            });
            await trezordNode.stop();
        });

        it('GET /enumerate', async () => {
            const trezordNode = createTrezordNode({ port });
            await trezordNode.start();

            await new Promise(resolve => setTimeout(resolve, 1000));

            const url = trezordNode.server[0]!.getRouteAddress('/enumerate') || '/';
            const response = await bridgeApiCall({
                url,
                method: 'POST',
            });
            if (!response.success) {
                throw new Error(response.error.code);
            }
            expect(response.payload).toEqual([{ path: '1', session: null, apiType: 'usb' }]);
            await trezordNode.stop();
        });

        it('/enumerate aborted', async () => {
            const enumerateSpy = jest.fn(
                (signal: AbortSignal) =>
                    new Promise(resolve => {
                        // simulate some api work
                        setTimeout(() => {
                            // and when done check if it was not aborted
                            if (signal.aborted) {
                                resolve({ success: false, error: 'Aborted' });
                            } else {
                                resolve({ success: true, payload: [] });
                            }
                        }, 200);
                    }),
            );
            const trezordNode = createTrezordNode(
                { port: (await getFreePort())[0] },
                { enumerate: enumerateSpy },
            );
            await trezordNode.start();
            await new Promise(resolve => setTimeout(resolve, 100));

            const abortController = new AbortController();
            const url = trezordNode.server[0]!.getRouteAddress('/enumerate')!;
            const enumeratePromise = bridgeApiCall({
                url,
                method: 'POST',
                signal: abortController.signal,
                body: {},
            });

            // give fetch api some time to make request
            await new Promise(resolve => setTimeout(resolve, 100));
            abortController.abort();

            // error is thrown immediately by fetch api ...
            const result = await enumeratePromise;
            expect(result.success).toBe(false);
            // ... but api.enumerate is still processing
            expect(enumerateSpy).toHaveBeenCalledTimes(1);
            // wait for api.enumerate result and check if it was resolved with failure
            const { results } = enumerateSpy.mock;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const enumerateSpyResult: (typeof results)[number] = results[0];
            const enumerateResult = await enumerateSpyResult.value;
            expect(enumerateResult.success).toBe(false);
            expect(enumerateResult.error).toContain('Aborted');

            await trezordNode.stop();
        });

        it('/call aborted', async () => {
            const writeSpy = jest.fn(
                (...[, , options]: AbstractApiArgs<'write'>) =>
                    new Promise(resolve => {
                        // simulate some api work
                        setTimeout(() => {
                            // and when done check if it was not aborted
                            if (options?.signal?.aborted) {
                                resolve({ success: false, error: 'Aborted' });
                            } else {
                                resolve({ success: true, payload: [] });
                            }
                        }, 100);
                    }),
            );
            const readSpy = jest.fn();
            const trezordNode = createTrezordNode(
                { port: (await getFreePort())[0] },
                { write: writeSpy, read: readSpy },
            );
            await trezordNode.start();

            await new Promise(resolve => setTimeout(resolve, 100));

            const abortController = new AbortController();
            const url = trezordNode.server[0]!.getRouteAddress('/')!;
            await bridgeApiCall({
                url: url + 'enumerate',
                method: 'POST',
                signal: abortController.signal,
                body: {},
            });
            await bridgeApiCall({
                url: url + 'acquire/1/null',
                method: 'POST',
                signal: abortController.signal,
            });

            const callPromise = bridgeApiCall({
                url: url + 'call/1',
                method: 'POST',
                body: JSON.stringify({ protocol: 'v1', data: '3f2323' + '000000000000' }),
                signal: abortController.signal,
            });

            // give fetch api some time to make request
            await new Promise(resolve => setTimeout(resolve, 50));
            abortController.abort();

            // error is thrown immediately by fetch api ...
            const result = await callPromise;
            expect(result.success).toBe(false);

            // ... but api.write is still processing
            expect(writeSpy).toHaveBeenCalledTimes(1);
            // wait for api.write result and check if it was resolved with failure
            const { results } = writeSpy.mock;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const writeSpyResult: (typeof results)[number] = results[0];
            const enumerateResult = await writeSpyResult.value;
            expect(enumerateResult.success).toBe(false);
            expect(enumerateResult.error).toContain('Aborted');
            // api.read was never called since read was aborted
            expect(readSpy).toHaveBeenCalledTimes(0);

            await trezordNode.stop();
        });

        describe('listen', () => {
            // client mimicking BridgeTransport class
            class Client extends EventEmitter {
                listenResult: any = [];
                disposed = false;
                abortController = new AbortController();
                url: string;

                constructor({ url }: { url: string }) {
                    super();
                    this.url = url;
                }

                dispose() {
                    this.disposed = true;
                    this.abortController.abort();
                }

                listen() {
                    if (this.disposed) {
                        return;
                    }
                    bridgeApiCall({
                        url: this.url,
                        method: 'POST',
                        body: this.listenResult,
                        signal: this.abortController.signal,
                    }).then(res => {
                        if (res.success) {
                            this.listenResult = res.payload;
                            this.emit('listen-response', res.payload);

                            return this.listen();
                        }
                    });
                }
            }

            const createServerAndListeningClient = async () => {
                let changeDescriptorsOnApi = (..._args: any[]) => {};

                const onDebugLogSpy = jest.fn();

                const server = createTrezordNode(
                    {
                        port: (await getFreePort())[0],
                        // @ts-expect-error
                        logger: {
                            ...muteLogger,
                            debug: (..._args: string[]) => {
                                onDebugLogSpy(..._args);
                            },
                            info: (..._args: string[]) => onDebugLogSpy,
                        },
                    },
                    {
                        enumerate: () => ({ success: true, payload: [] }),
                        on: (eventName: string, callback: typeof changeDescriptorsOnApi) => {
                            if (eventName === 'transport-interface-change') {
                                changeDescriptorsOnApi = callback;
                            }
                        },
                    },
                );

                await server.start();

                const url = server.server[0]!.getRouteAddress('/listen')!;
                const client = new Client({ url });
                const onListenResolvedSpy = jest.fn();
                client.on('listen-response', onListenResolvedSpy);

                client.listen();
                // it takes some tome for /listen request to propagate.
                // todo: solve later
                await resolveAfter(1000);

                return {
                    server,
                    client,
                    changeDescriptorsOnApi,
                    onListenResolvedSpy,
                    onDebugLogSpy,
                };
            };

            it('api emitting events and listen correctly reporting', async () => {
                const { server, client, changeDescriptorsOnApi, onListenResolvedSpy } =
                    await createServerAndListeningClient();

                // one device connect
                changeDescriptorsOnApi([{ path: '1' }]);
                await waitForNthEventOfType(client, 'listen-response', 1);
                expect(onListenResolvedSpy).toHaveBeenNthCalledWith(1, [
                    { path: '1', session: null, apiType: 'usb' },
                ]);

                // another device connect
                changeDescriptorsOnApi([{ path: '1' }, { path: '2' }]);
                await waitForNthEventOfType(client, 'listen-response', 1);
                expect(onListenResolvedSpy).toHaveBeenLastCalledWith([
                    { path: '1', session: null, apiType: 'usb' },
                    { path: '2', session: null, apiType: 'usb' },
                ]);

                client.dispose();
                await server.stop();
            });

            it('test rapid changes of descriptors on api level', async () => {
                const { server, client, changeDescriptorsOnApi, onListenResolvedSpy } =
                    await createServerAndListeningClient();

                // 2 devices connected quickly after each other
                changeDescriptorsOnApi([{ path: '1' }]);
                changeDescriptorsOnApi([{ path: '1' }, { path: '2' }]);

                // both events were registered and reported
                await waitForNthEventOfType(client, 'listen-response', 2);
                expect(onListenResolvedSpy).toHaveBeenLastCalledWith([
                    { path: '1', session: null, apiType: 'usb' },
                    { path: '2', session: null, apiType: 'usb' },
                ]);

                // both devices disconnected quickly after each other
                changeDescriptorsOnApi([{ path: '1' }]);
                changeDescriptorsOnApi([]);

                // only the last event was reported, this is correct throttling behavior
                await waitForNthEventOfType(client, 'listen-response', 1);
                expect(onListenResolvedSpy).toHaveBeenLastCalledWith([]);

                client.dispose();
                await server.stop();
            });

            test('listen aborted using client.dispose', async () => {
                const { server, client, onListenResolvedSpy } =
                    await createServerAndListeningClient();

                client.dispose();
                await new Promise(resolve => setTimeout(resolve, 2000));

                expect(onListenResolvedSpy).not.toHaveBeenCalled();
                await server.stop();
            });
        });
    });
});
