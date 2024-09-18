import EventEmitter from 'events';

import { getFreePort } from '@trezor/node-utils';
import { AbstractApi } from '@trezor/transport/src/api/abstract';
import { bridgeApiCall } from '@trezor/transport/src/utils/bridgeApiCall';
import { createTimeoutPromise } from '@trezor/utils';
import { UdpApi } from '@trezor/transport/src/api/udp';

import { TrezordNode } from '../src/http';

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
) => {
    // wait for all device-connect events
    return new Promise<void>(resolve => {
        let i = 0;
        emitter.on(type, () => {
            if (++i === number) {
                resolve();
            }
        });
    });
};

// todo: Szymon is about to re-use this from a single file
const createTransportApi = (override = {}) => {
    const api = new UdpApi({ logger: muteLogger });

    return {
        ...api,
        chunkSize: 0,
        enumerate: () => {
            return Promise.resolve({ success: true, payload: [{ path: '1' }] });
        },
        on: () => {},
        off: () => {},
        openDevice: (path: string) => {
            return Promise.resolve({ success: true, payload: [{ path }] });
        },
        closeDevice: () => {
            return Promise.resolve({ success: true });
        },
        write: () => {
            return Promise.resolve({ success: true });
        },
        read: () => {
            return Promise.resolve({
                success: true,
                payload: Buffer.from('3f232300110000000c1002180020006000aa010154', 'hex'), // partial proto.Features
                // payload: Buffer.from('3f23230002000000060a046d656f77', 'hex'), // proto.Success
            });
        },
        dispose: () => {},
        listen: () => {},

        ...override,
    } as unknown as AbstractApi;
};

const createTrezordNode = (
    constructorParams?: Partial<ConstructorParameters<typeof TrezordNode>[0]>,
    apiOverride?: any,
) => {
    return new TrezordNode({
        api: createTransportApi(apiOverride),
        // @ts-expect-error
        logger: muteLogger,
        ...constructorParams,
    });
};

describe('http', () => {
    let port: number;
    beforeAll(async () => {
        port = await getFreePort();
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
                port: await getFreePort(),
                ...params,
            });
            await trezordNode.start();
            const url = trezordNode.server?.getRouteAddress('/') || '/';

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

        it('POST / getInfo with protocolMessage flag enabled', async () => {
            const { trezordNode, url } = await setupTrezordNode();
            const response = await bridgeApiCall({
                url,
                method: 'POST',
            });
            if (!response.success) {
                throw new Error(response.error + ' ' + response.message);
            }
            expect(response.payload).toEqual({
                version: trezordNode.version,
                protocolMessages: true,
            });
            await trezordNode.stop();
        });

        it('POST / getInfo with protocolMessage flag disabled', async () => {
            const { trezordNode, url } = await setupTrezordNode({ protocolMessages: false });
            const response = await bridgeApiCall({
                url,
                method: 'POST',
            });
            if (!response.success) {
                throw new Error(response.error + ' ' + response.message);
            }
            expect(response.payload).toEqual({
                version: trezordNode.version,
                protocolMessages: false,
            });
            await trezordNode.stop();
        });

        it('/call protocolMessage validation', async () => {
            const { trezordNode, url } = await setupTrezordNode();

            let res;
            // no protocol, legacy way
            res = await bridgeApiCall({
                url: `${url}call/1`,
                method: 'POST',
                body: GET_FEATURES,
            });
            if (!res.success) {
                throw new Error(res.error + ' ' + res.message);
            }
            expect(res.payload).toBe(FEATURES);
            // invalid legacy message (not a hex)
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
                throw new Error(res.error + ' ' + res.message);
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
                throw new Error(res.error);
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
            // no protocol, legacy way
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                body: GET_FEATURES,
            });
            if (!res.success) {
                throw new Error(res.error + ' ' + res.message);
            }
            expect(res.payload).toBe('');
            // invalid legacy message (not a hex)
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
                throw new Error(res.error + ' ' + res.message);
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
                throw new Error(res.error + ' ' + res.message);
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
                message: 'Invalid BridgeProtocolMessage protocol',
            });

            // invalid protocol message (not a hex)
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'v1', data: 'not a hex' }),
            });
            expect(res).toMatchObject({
                success: false,
                message: 'Invalid BridgeProtocolMessage data',
            });

            // invalid protocol message (malformed json)
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                body: '',
            });
            expect(res).toMatchObject({
                success: false,
                message: 'Invalid BridgeProtocolMessage body',
            });
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
            });
            expect(res).toMatchObject({
                success: false,
                message: 'Invalid BridgeProtocolMessage body',
            });
            res = await bridgeApiCall({
                url: `${url}post/1`,
                method: 'POST',
                // @ts-expect-error
                body: null,
            });
            expect(res).toMatchObject({
                success: false,
                message: 'Invalid BridgeProtocolMessage body',
            });

            await trezordNode.stop();
        });

        it('/read protocolMessage validation', async () => {
            const { trezordNode, url } = await setupTrezordNode();

            let res;
            // no protocol, legacy way
            res = await bridgeApiCall({
                url: `${url}read/1`,
                method: 'POST',
            });
            if (!res.success) {
                throw new Error(res.error + ' ' + res.message);
            }
            expect(res.payload).toBe(FEATURES);

            // protocol bridge, json response without magic header
            res = await bridgeApiCall({
                url: `${url}read/1`,
                method: 'POST',
                body: JSON.stringify({ protocol: 'bridge' }),
            });
            if (!res.success) {
                throw new Error(res.error + ' ' + res.message);
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
                throw new Error(res.error + ' ' + res.message);
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

                const url = trezordNode.server!.getRouteAddress('/')!;
                const response = await bridgeApiCall({
                    url,
                    method: 'GET',
                });
                if (!response.success) {
                    throw new Error(response.error);
                }
                expect(response.payload).toContain('<html');

                await trezordNode.stop();
            });
        });

        it('POST /', async () => {
            const trezordNode = createTrezordNode({ port });
            await trezordNode.start();

            await new Promise(resolve => setTimeout(resolve, 1000));

            const url = trezordNode.server!.getRouteAddress('/')!;
            const response = await bridgeApiCall({
                url,
                method: 'POST',
            });
            if (!response.success) {
                throw new Error(response.error);
            }
            expect(response.payload).toEqual({
                version: trezordNode.version,
                protocolMessages: true,
            });
            await trezordNode.stop();
        });

        it('enumerate', async () => {
            const trezordNode = createTrezordNode({ port });
            await trezordNode.start();

            await new Promise(resolve => setTimeout(resolve, 1000));

            const url = trezordNode.server!.getRouteAddress('/enumerate')!;
            const response = await bridgeApiCall({
                url,
                method: 'POST',
            });
            if (!response.success) {
                throw new Error(response.error);
            }
            expect(response.payload).toEqual([{ path: '1', session: null }]);
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
                { port: await getFreePort() },
                { enumerate: enumerateSpy },
            );
            await trezordNode.start();
            await new Promise(resolve => setTimeout(resolve, 100));

            const abortController = new AbortController();
            const url = trezordNode.server!.getRouteAddress('/enumerate')!;
            const enumeratePromise = bridgeApiCall({
                url,
                method: 'POST',
                signal: abortController.signal,
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
            const enumerateResult = await enumerateSpy.mock.results[0].value;
            expect(enumerateResult.success).toBe(false);
            expect(enumerateResult.error).toContain('Aborted');

            await trezordNode.stop();
        });

        it('/call aborted', async () => {
            const writeSpy = jest.fn(
                (_p: any, _d: any, signal: AbortSignal) =>
                    new Promise(resolve => {
                        // simulate some api work
                        setTimeout(() => {
                            // and when done check if it was not aborted
                            if (signal.aborted) {
                                resolve({ success: false, error: 'Aborted' });
                            } else {
                                resolve({ success: true, payload: [] });
                            }
                        }, 100);
                    }),
            );
            const readSpy = jest.fn();
            const trezordNode = createTrezordNode(
                { port: await getFreePort() },
                { write: writeSpy, read: readSpy },
            );
            await trezordNode.start();

            await new Promise(resolve => setTimeout(resolve, 100));

            const abortController = new AbortController();
            const url = trezordNode.server!.getRouteAddress('/')!;
            await bridgeApiCall({
                url: url + 'enumerate',
                method: 'POST',
                body: {},
                signal: abortController.signal,
            });
            await bridgeApiCall({
                url: url + 'acquire/1/null',
                method: 'POST',
                body: {},
                signal: abortController.signal,
            });

            const callPromise = bridgeApiCall({
                url: url + 'call/1',
                method: 'POST',
                body: '000000000000',
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
            const enumerateResult = await writeSpy.mock.results[0].value;
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
                        port: await getFreePort(),
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
                        enumerate: () => {
                            return { success: true, payload: [] };
                        },
                        on: (eventName: string, callback: typeof changeDescriptorsOnApi) => {
                            if (eventName === 'transport-interface-change') {
                                changeDescriptorsOnApi = callback;
                            }
                        },
                    },
                );

                await server.start();

                const url = server.server!.getRouteAddress('/listen')!;
                const client = new Client({ url });
                const onListenResolvedSpy = jest.fn();
                client.on('listen-response', onListenResolvedSpy);

                client.listen();
                // it takes some tome for /listen request to propagate.
                // todo: solve later
                await createTimeoutPromise(1000);

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
                    { path: '1', session: null },
                ]);

                // another device connect
                changeDescriptorsOnApi([{ path: '1' }, { path: '2' }]);
                await waitForNthEventOfType(client, 'listen-response', 1);
                expect(onListenResolvedSpy).toHaveBeenLastCalledWith([
                    { path: '1', session: null },
                    { path: '2', session: null },
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
                    { path: '1', session: null },
                    { path: '2', session: null },
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
