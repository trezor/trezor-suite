import { createDeferred, Deferred } from '@trezor/utils';

import { AbstractTransport, AbstractTransportParams, AcquireInput, ReleaseInput } from './abstract';
import { buildAndSend } from '../utils/send';
import { receiveAndParse } from '../utils/receive';
import { SessionsClient } from '../sessions/client';
import * as ERRORS from '../errors';
import type { UsbInterface } from '../interfaces/usb';

export type UsbTransportConstructorParams = AbstractTransportParams & {
    usbInterface: UsbInterface;
    sessionsClient: (typeof SessionsClient)['prototype'];
};

/**
 * Abstract class for transports with direct usb access (webusb, nodeusb).
 */
export abstract class AbstractUsbTransport extends AbstractTransport {
    // sessions client is a standardized interface for communicating with sessions backend
    // which can live in couple of context (shared worker, local module, websocket server etc)
    private sessionsClient: UsbTransportConstructorParams['sessionsClient'];
    private transportInterface: UsbInterface;
    protected acquirePromise?: Deferred<void>;

    constructor({ messages, usbInterface, sessionsClient, signal }: UsbTransportConstructorParams) {
        super({ messages, signal });
        this.sessionsClient = sessionsClient;
        this.transportInterface = usbInterface;
    }

    public init(): ReturnType<AbstractTransport['init']> {
        return this.scheduleAction(async () => {
            const handshakeRes = await this.sessionsClient.handshake();
            return handshakeRes.success
                ? this.success(undefined)
                : this.unknownError('handshake error', []);
        });
    }

    public listen() {
        if (this.listening) {
            return this.error({ error: ERRORS.ALREADY_LISTENING });
        }

        this.listening = true;

        // 1. transport interface reports descriptors change
        this.transportInterface.on('transport-interface-change', devices => {
            // 2. we signal this to sessions background
            this.sessionsClient.enumerateDone({
                paths: devices,
            });
        });
        // 3. based on 2.sessions background distributes information about descriptors change to all clients
        this.sessionsClient.on('descriptors', async descriptors => {
            // 4. we propagate new descriptors to higher levels
            if (this.acquirePromise?.promise) {
                await this.acquirePromise.promise;
            }
            this.handleDescriptorsChange(descriptors);
        });

        return this.success(undefined);
    }

    public enumerate() {
        return this.scheduleAction(async () => {
            // notify sessions background that a client is going to access usb
            await this.sessionsClient.enumerateIntent();
            // enumerate usb interface
            const enumerateResult = await this.transportInterface.enumerate();

            if (!enumerateResult.success) {
                return enumerateResult;
            }
            const occupiedPaths = enumerateResult.payload;

            // inform sessions background about occupied paths and get descriptors back
            const enumerateDoneResponse = await this.sessionsClient.enumerateDone({
                paths: occupiedPaths,
            });

            return this.success(enumerateDoneResponse.payload.descriptors);
        });
    }

    public acquire({ input }: { input: AcquireInput }) {
        return this.scheduleAction(
            async () => {
                const { path } = input;

                if (this.listening) {
                    this.listenPromise[path] = createDeferred();
                }

                this.acquirePromise = createDeferred();

                const acquireIntentResponse = await this.sessionsClient.acquireIntent(input);

                if (this.acquirePromise) {
                    this.acquirePromise.resolve(undefined);
                }

                if (!acquireIntentResponse.success) {
                    return this.error({ error: acquireIntentResponse.error });
                }

                this.acquiredUnconfirmed[path] = acquireIntentResponse.payload.session;

                const reset = !!input.previous;
                const openDeviceResult = await this.transportInterface.openDevice(path, reset);

                if (!openDeviceResult.success) {
                    if (this.listenPromise) {
                        this.listenPromise[path].resolve(openDeviceResult);
                    }
                    return openDeviceResult;
                }

                this.sessionsClient.acquireDone({ path });

                if (!this.listenPromise[path]) {
                    return this.success(acquireIntentResponse.payload.session);
                }

                return this.listenPromise[path].promise.finally(() => {
                    delete this.listenPromise[path];
                });
            },
            undefined,
            [ERRORS.DEVICE_DISCONNECTED_DURING_ACTION, ERRORS.SESSION_WRONG_PREVIOUS],
        );
    }

    public release({ path, session, onClose }: ReleaseInput) {
        return this.scheduleAction(async () => {
            if (this.listening) {
                this.releasingSession = session;
                this.listenPromise[path] = createDeferred();
            }

            const releaseIntentResponse = await this.sessionsClient.releaseIntent({
                session,
            });

            if (!releaseIntentResponse.success) {
                return this.error({ error: releaseIntentResponse.error });
            }

            const releasePromise = this.releaseDevice(releaseIntentResponse.payload.path);
            if (onClose) return this.success(undefined);

            await releasePromise;

            await this.sessionsClient.releaseDone({
                path: releaseIntentResponse.payload.path,
            });

            if (!this.listenPromise[path]) {
                return this.success(undefined);
            }

            return this.listenPromise[path].promise
                .then(() => this.success(undefined))
                .finally(() => {
                    delete this.listenPromise[path];
                });
        });
    }

    public call({
        session,
        name,
        data,
    }: {
        session: string;
        name: string;
        data: Record<string, unknown>;
    }) {
        return this.scheduleAction(
            async () => {
                const getPathBySessionResponse = await this.sessionsClient.getPathBySession({
                    session,
                });
                if (!getPathBySessionResponse.success) {
                    // session not found means that device was disconnected
                    if (getPathBySessionResponse.error === 'session not found') {
                        return this.error({ error: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
                    }
                    return this.error({ error: ERRORS.UNEXPECTED_ERROR });
                }
                const { path } = getPathBySessionResponse.payload;

                try {
                    await buildAndSend(
                        this.messages,
                        (buffer: Buffer) =>
                            this.transportInterface.write(path, buffer).then(result => {
                                if (!result.success) {
                                    // todo:
                                    throw new Error(result.error);
                                }
                            }),
                        name,
                        data,
                    );

                    const message = await receiveAndParse(this.messages, () =>
                        this.transportInterface.read(path).then(result => {
                            if (result.success) {
                                return result.payload;
                            }
                            throw new Error(result.error);
                        }),
                    );

                    return this.success(message);
                } catch (err) {
                    // if user revokes usb permissions in browser we need a way how propagate that the device was technically disconnected,
                    if (err.message === ERRORS.DEVICE_DISCONNECTED_DURING_ACTION) {
                        this.enumerate();
                    }

                    return this.unknownError(err, [
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                        ERRORS.DEVICE_NOT_FOUND,
                        ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                        ERRORS.INTERFACE_DATA_TRANSFER,
                    ]);
                }
            },
            { timeout: undefined },
        );
    }

    public send({
        data,
        session,
        name,
    }: {
        data: Record<string, unknown>;
        session: string;
        name: string;
    }) {
        return this.scheduleAction(async () => {
            const getPathBySessionResponse = await this.sessionsClient.getPathBySession({
                session,
            });
            if (!getPathBySessionResponse.success) {
                return this.error({ error: getPathBySessionResponse.error });
            }
            const { path } = getPathBySessionResponse.payload;

            try {
                await buildAndSend(
                    this.messages,
                    (buffer: Buffer) =>
                        this.transportInterface.write(path, buffer).then(result => {
                            if (!result.success) {
                                throw new Error(result.error);
                            }
                        }),
                    name,
                    data,
                );
                return this.success(undefined);
            } catch (err) {
                if (err.message === ERRORS.DEVICE_DISCONNECTED_DURING_ACTION) {
                    this.enumerate();
                }

                return this.unknownError(err, [ERRORS.DEVICE_DISCONNECTED_DURING_ACTION]);
            }
        });
    }

    public receive({ session }: { session: string }) {
        return this.scheduleAction(async () => {
            const getPathBySessionResponse = await this.sessionsClient.getPathBySession({
                session,
            });
            if (!getPathBySessionResponse.success) {
                return this.error({ error: getPathBySessionResponse.error });
            }
            const { path } = getPathBySessionResponse.payload;

            try {
                const message = await receiveAndParse(this.messages, () =>
                    this.transportInterface.read(path).then(result => {
                        if (!result.success) {
                            throw new Error(result.error);
                        }
                        return result.payload;
                    }),
                );

                return this.success(message);
            } catch (err) {
                if (err.message === ERRORS.DEVICE_DISCONNECTED_DURING_ACTION) {
                    this.enumerate();
                }

                return this.unknownError(err, [ERRORS.DEVICE_DISCONNECTED_DURING_ACTION]);
            }
        });
    }

    releaseDevice(path: string) {
        return this.transportInterface.closeDevice(path);
    }

    stop() {
        this.transportInterface.on('transport-interface-change', () => {
            this.logger.debug('device connected after transport stopped');
        });
        this.stopped = true;
        this.abortController.abort();
    }
}
