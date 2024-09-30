import { SessionsBackground } from '../sessions/background';
import { v1 as v1Protocol } from '@trezor/protocol';

import {
    AbstractTransport,
    AbstractTransportParams,
    AbstractTransportMethodParams,
    AcquireReleaseChange,
} from './abstract';
import { AbstractApi } from '../api/abstract';
import { buildMessage, createChunks, sendChunks } from '../utils/send';
import { receiveAndParse } from '../utils/receive';
import { SessionsClient } from '../sessions/client';
import * as ERRORS from '../errors';
import { Session } from '../types';
import { SessionsBackgroundInterface } from '../sessions/types';

interface ConstructorParams extends AbstractTransportParams {
    api: AbstractApi;
}

/**
 * Abstract class for transports with abstract api (webusb, nodeusb, udp, react-native).
 */
export abstract class AbstractApiTransport extends AbstractTransport {
    // sessions client is a standardized interface for communicating with sessions backend
    // which can live in couple of context (shared worker, local module, websocket server etc)
    protected sessionsClient: SessionsClient;
    protected sessionsBackground: SessionsBackgroundInterface;

    protected api: AbstractApi;

    constructor({ messages, api, logger }: ConstructorParams) {
        super({ messages, logger });
        this.api = api;
        this.sessionsBackground = new SessionsBackground();
        this.sessionsClient = new SessionsClient(this.sessionsBackground);
    }

    public init({ signal }: AbstractTransportMethodParams<'init'> = {}) {
        return this.scheduleAction(
            async () => {
                const handshakeRes = await this.sessionsClient.handshake();
                this.stopped = !handshakeRes.success;

                return handshakeRes;
            },
            { signal },
        );
    }

    public listen() {
        if (this.listening) {
            return this.error({ error: ERRORS.ALREADY_LISTENING });
        }

        this.listening = true;

        // 1. transport api reports descriptors change
        this.api.on('transport-interface-change', descriptors => {
            this?.logger?.debug('new descriptors from api', descriptors);
            // 2. we signal this to sessions background
            this.sessionsClient.enumerateDone({
                descriptors,
            });
        });
        // 3. based on 2.sessions background distributes information about descriptors change to all clients
        this.sessionsClient.on('descriptors', descriptors => {
            this?.logger?.debug('new descriptors from background', descriptors);
            // 4. we propagate new descriptors to higher levels
            this.handleDescriptorsChange(descriptors);
        });

        return this.success(undefined);
    }

    public enumerate({ signal }: AbstractTransportMethodParams<'enumerate'> = {}) {
        return this.scheduleAction(
            async signal => {
                // enumerate usb api
                const enumerateResult = await this.api.enumerate(signal);

                if (!enumerateResult.success) {
                    return enumerateResult;
                }
                // partial descriptors with path
                const descriptors = enumerateResult.payload;

                // inform sessions background about occupied paths and get descriptors back
                const enumerateDoneResponse = await this.sessionsClient.enumerateDone({
                    descriptors,
                });

                return this.success(enumerateDoneResponse.payload.descriptors);
            },
            { signal },
        );
    }

    public acquire({ input, signal }: AbstractTransportMethodParams<'acquire'>) {
        return this.scheduleAction(
            async signal => {
                const { path } = input;

                const promise = this.listening
                    ? new Promise<AcquireReleaseChange>(resolve =>
                          this.acquireReleaseEmitter.once(path, resolve),
                      )
                    : undefined;

                const acquireIntentResponse = await this.sessionsClient.acquireIntent(input);

                if (!acquireIntentResponse.success) {
                    return this.error({ error: acquireIntentResponse.error });
                }

                this.acquireUnconfirmed[path] = acquireIntentResponse.payload.session;

                const reset = !!input.previous;
                const openDeviceResult = await this.api.openDevice(
                    acquireIntentResponse.payload.path,
                    reset,
                    signal,
                );

                if (!openDeviceResult.success) {
                    return openDeviceResult;
                }

                this.sessionsClient.acquireDone({ path });

                if (!promise) {
                    return this.success(acquireIntentResponse.payload.session);
                }

                const change = await promise;

                if (change.type === 'device-missing') {
                    return this.error({ error: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
                }

                if (change.session !== acquireIntentResponse.payload.session) {
                    return this.error({ error: ERRORS.SESSION_WRONG_PREVIOUS });
                }

                return this.success(acquireIntentResponse.payload.session);
            },
            { signal },
            [ERRORS.DEVICE_DISCONNECTED_DURING_ACTION, ERRORS.SESSION_WRONG_PREVIOUS],
        );
    }

    public release({ path, session, onClose, signal }: AbstractTransportMethodParams<'release'>) {
        return this.scheduleAction(
            async () => {
                if (this.listening) {
                    this.releaseUnconfirmed[path] = session;
                }

                const promise = this.listening
                    ? new Promise<AcquireReleaseChange>(resolve =>
                          this.acquireReleaseEmitter.once(path, resolve),
                      )
                    : undefined;

                const releaseIntentResponse = await this.sessionsClient.releaseIntent({
                    session,
                });

                if (!releaseIntentResponse.success) {
                    return this.error({ error: releaseIntentResponse.error });
                }

                const releasePromise = this.releaseDevice(session);
                if (onClose) return this.success(undefined);

                await releasePromise;

                await this.sessionsClient.releaseDone({
                    path: releaseIntentResponse.payload.path,
                });

                if (!promise) {
                    return this.success(undefined);
                }

                const change = await promise;

                if (change.type === 'device-missing') {
                    // TODO but it would be success before, is it ok? NO, it is success
                    return this.error({ error: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
                }

                return this.success(undefined);
            },
            { signal },
        );
    }

    public call({
        session,
        name,
        data,
        protocol: customProtocol,
        signal,
    }: AbstractTransportMethodParams<'call'>) {
        return this.scheduleAction(
            async signal => {
                const handleError = (error: string) => {
                    // if user revokes usb permissions in browser we need a way how propagate that the device was technically disconnected,
                    if (error === ERRORS.DEVICE_DISCONNECTED_DURING_ACTION) {
                        this.enumerate();
                    }
                };
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

                const protocol = customProtocol || v1Protocol;
                const bytes = buildMessage({
                    messages: this.messages,
                    name,
                    data,
                    encode: protocol.encode,
                });
                const chunks = createChunks(
                    bytes,
                    protocol.getChunkHeader(bytes),
                    this.api.chunkSize,
                );
                const apiWrite = (chunk: Buffer) => this.api.write(path, chunk, signal);
                const sendResult = await sendChunks(chunks, apiWrite);

                if (!sendResult.success) {
                    handleError(sendResult.error);

                    return sendResult;
                }

                const readResult = await receiveAndParse(
                    this.messages,
                    () => this.api.read(path, signal),
                    protocol,
                );

                if (!readResult.success) {
                    handleError(readResult.error);

                    return readResult;
                }

                return readResult;
            },
            { signal, timeout: undefined },
        );
    }

    public send({ data, session, name, protocol, signal }: AbstractTransportMethodParams<'send'>) {
        return this.scheduleAction(
            async signal => {
                const getPathBySessionResponse = await this.sessionsClient.getPathBySession({
                    session,
                });
                if (!getPathBySessionResponse.success) {
                    return this.error({ error: getPathBySessionResponse.error });
                }
                const { path } = getPathBySessionResponse.payload;

                const { encode, getChunkHeader } = protocol || v1Protocol;
                const bytes = buildMessage({
                    messages: this.messages,
                    name,
                    data,
                    encode,
                });
                const chunks = createChunks(bytes, getChunkHeader(bytes), this.api.chunkSize);
                const apiWrite = (chunk: Buffer) => this.api.write(path, chunk, signal);
                const sendResult = await sendChunks(chunks, apiWrite);

                if (!sendResult.success) {
                    if (sendResult.error === ERRORS.DEVICE_DISCONNECTED_DURING_ACTION) {
                        this.enumerate();
                    }
                }

                return sendResult;
            },
            { signal, timeout: undefined },
        );
    }

    public receive({
        session,
        protocol: customProtocol,
        signal,
    }: AbstractTransportMethodParams<'receive'>) {
        return this.scheduleAction(
            async signal => {
                const getPathBySessionResponse = await this.sessionsClient.getPathBySession({
                    session,
                });
                if (!getPathBySessionResponse.success) {
                    return this.error({ error: getPathBySessionResponse.error });
                }
                const { path } = getPathBySessionResponse.payload;

                const protocol = customProtocol || v1Protocol;
                const message = await receiveAndParse(
                    this.messages,
                    () => this.api.read(path, signal),
                    protocol,
                );

                if (!message.success) {
                    console.log(message.error);
                    if (message.error === ERRORS.DEVICE_DISCONNECTED_DURING_ACTION) {
                        this.enumerate();
                    }
                }

                return message;
            },
            { signal, timeout: undefined },
        );
    }

    releaseDevice(session: Session) {
        return this.sessionsClient
            .getPathBySession({
                session,
            })
            .then(response => {
                if (response.success) {
                    return this.api.closeDevice(response.payload.path);
                }

                return this.success(undefined);
            });
    }

    stop() {
        super.stop();
        this.api.on('transport-interface-change', () => {
            this.logger?.debug('device connected after transport stopped');
        });
        this.sessionsBackground.dispose();
    }
}
