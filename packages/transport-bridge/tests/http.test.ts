import EventEmitter from 'events';

import { getFreePort } from '@trezor/node-utils';
import { AbstractApi } from '@trezor/transport/src/api/abstract';
import { bridgeApiCall } from '@trezor/transport/src/utils/bridgeApiCall';
import { createTimeoutPromise } from '@trezor/utils';

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
const createTransportApi = (override = {}) =>
    ({
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
        ...override,
    }) as unknown as AbstractApi;

const createTrezordNode = (
    constructorParams?: Partial<ConstructorParameters<typeof TrezordNode>[0]>,
    apiOverride?: any,
) => {
    return new TrezordNode({
        ...constructorParams,
        api: createTransportApi(apiOverride),
        // @ts-expect-error
        logger: muteLogger,
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
                method: 'POST',
            });
            if (!response.success) {
                throw new Error(response.error);
            }
            expect(response.payload).toEqual({ version: trezordNode.version });
            await trezordNode.stop();
        });

        it('enumerate', async () => {
            const trezordNode = new TrezordNode({
                port,
                api: createTransportApi(),
                // @ts-expect-error
                logger: muteLogger,
            });
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

                const server = createTrezordNode(
                    { port: await getFreePort() },
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

                return { server, client, changeDescriptorsOnApi, onListenResolvedSpy };
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
        });
    });
});
