import { v1 as v1Protocol } from '@trezor/protocol';

import {
    AbstractTransport,
    type AbstractTransportMethodParams,
    type AbstractTransportParams,
} from './abstract';
import { type AbstractApi, type OpenDeviceChannel } from '../api/abstract';
import { TRANSPORT } from '../constants';
import * as ERRORS from '../errors';
import { SessionsBackground } from '../sessions/background';
import { SessionsClient } from '../sessions/client';
import { type SessionsBackgroundInterface } from '../sessions/types';
import { callThpMessage, parseThpMessage, receiveThpMessage, sendThpMessage } from '../thp';
import { type Session } from '../types';
import { receiveAndParse } from '../utils/receive';
import { buildMessage, createChunks, sendChunks } from '../utils/send';

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

    constructor({ api, ...rest }: ConstructorParams) {
        super(rest);
        this.api = api;
        this.sessionsBackground = new SessionsBackground();
        this.sessionsClient = new SessionsClient(this.sessionsBackground);
    }

    get apiType() {
        return this.api.type;
    }

    public init({ signal }: AbstractTransportMethodParams<'init'> = {}) {
        return this.scheduleAction(
            async () => {
                this.sessionsClient.setBackground(this.sessionsBackground);
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

        this.api.listen();

        this.listening = true;

        // 1. transport api reports descriptors change
        this.api.on('transport-interface-change', descriptors => {
            this.logger?.debug('new descriptors from api', descriptors);
            // 2. we signal this to sessions background
            this.sessionsClient.enumerateDone({
                descriptors,
            });
        });
        // 3. based on 2.sessions background distributes information about descriptors change to all clients
        this.sessionsClient.on('descriptors', descriptors => {
            this.logger?.debug('new descriptors from background', descriptors);
            // 4. we propagate new descriptors to higher levels
            this.handleDescriptorsChange(descriptors);
        });

        this.sessionsClient.on('releaseRequest', descriptor => {
            this.deviceEvents.emit(descriptor.path, { type: TRANSPORT.DEVICE_REQUEST_RELEASE });
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

                const acquireIntentResponse = await this.sessionsClient.acquireIntent(input);

                if (!acquireIntentResponse.success) {
                    return this.error({ error: acquireIntentResponse.error.code });
                }

                const reset = !!input.previous;
                const openDeviceResult = await this.api.openDevice(
                    acquireIntentResponse.payload.path,
                    {
                        reset,
                        signal,
                        channel: 'read',
                    },
                );

                if (!openDeviceResult.success) {
                    return openDeviceResult;
                }

                this.sessionsClient.acquireDone({ path, sessionOwner: this.id });

                return this.success(acquireIntentResponse.payload.session);
            },
            { signal },
            [ERRORS.DEVICE_DISCONNECTED_DURING_ACTION, ERRORS.SESSION_WRONG_PREVIOUS],
        );
    }

    public subscribe({
        path,
        channels,
        signal,
    }: {
        path: any;
        channels: OpenDeviceChannel[];
        signal?: AbortSignal;
    }) {
        return this.scheduleAction(
            async signal => {
                const entries = await Promise.all(
                    channels.map(async channel => {
                        try {
                            const res = await this.api.openDevice(path, {
                                reset: false,
                                signal,
                                channel,
                            });

                            return [channel, res.success];
                        } catch {
                            return [channel, false];
                        }
                    }),
                );

                const map = Object.fromEntries(entries);

                return this.success(map as Record<OpenDeviceChannel, boolean>);
            },
            { signal },
        );
    }

    public release({ path: _, session, signal }: AbstractTransportMethodParams<'release'>) {
        return this.scheduleAction(
            async () => {
                const releaseIntentResponse = await this.sessionsClient.releaseIntent({
                    session,
                });

                if (!releaseIntentResponse.success) {
                    return this.error({ error: releaseIntentResponse.error.code });
                }

                await this.api.closeDevice(releaseIntentResponse.payload.path, { channel: 'read' });

                await this.sessionsClient.releaseDone({
                    path: releaseIntentResponse.payload.path,
                });

                return this.success(null);
            },
            { signal },
        );
    }

    public releaseSync(session: Session) {
        // Obviously not sync as was advertised. Also looks a bit weird but should be the same as before.
        this.sessionsClient.releaseIntent({ session }).then(res => {
            if (res.success) this.api.closeDevice(res.payload.path, { channel: 'read' });
        });
    }

    public call({
        session,
        name,
        data,
        protocol: customProtocol,
        thpState,
        signal,
        timeout,
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
                    if (getPathBySessionResponse.error.code === 'session not found') {
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
                    protocol,
                    thpState,
                });
                const [, chunkHeader] = protocol.getHeaders(bytes);
                const chunks = createChunks(
                    bytes,
                    chunkHeader,
                    this.api.nativeWriteChunking ? 0 : this.api.chunkSize,
                );
                let progress = 0;
                const apiWrite = (chunk: Buffer, attemptSignal?: AbortSignal) => {
                    if (chunks.length > 1) {
                        progress++;
                        this.emit(TRANSPORT.SEND_MESSAGE_PROGRESS, progress / chunks.length);
                    }

                    return this.api.write(path, chunk, attemptSignal || signal);
                };

                const apiRead = (attemptSignal?: AbortSignal) =>
                    this.api.read(path, attemptSignal || signal);

                if (protocol.name === 'v2') {
                    const prevNonce = thpState?.sendNonce;
                    const callResult = await callThpMessage({
                        thpState,
                        chunks,
                        apiWrite,
                        apiRead,
                        signal,
                        logger: this.logger,
                    });
                    if (!callResult.success) {
                        handleError(callResult.error.code);

                        return callResult;
                    }

                    // sync bit and nonce updated by Cancel
                    if (prevNonce === thpState?.sendNonce) {
                        thpState?.sync('send', name);
                    }
                    const message = parseThpMessage({
                        messages: this.messages,
                        decoded: callResult.payload,
                        thpState,
                    });
                    thpState?.sync('recv', message.type);

                    return this.success(message);
                }
                const sendResult = await sendChunks(chunks, apiWrite);

                if (!sendResult.success) {
                    handleError(sendResult.error.code);

                    return sendResult;
                }

                const readResult = await receiveAndParse(this.messages, apiRead, protocol);

                if (!readResult.success) {
                    handleError(readResult.error.code);

                    return readResult;
                }

                return readResult;
            },
            { signal, graceful: true, timeout },
        );
    }

    public send({
        data,
        session,
        name,
        protocol: customProtocol,
        thpState,
        signal,
        timeout,
    }: AbstractTransportMethodParams<'send'>) {
        return this.scheduleAction(
            async signal => {
                const getPathBySessionResponse = await this.sessionsClient.getPathBySession({
                    session,
                });
                if (!getPathBySessionResponse.success) {
                    return this.error({ error: getPathBySessionResponse.error.code });
                }
                const { path } = getPathBySessionResponse.payload;

                const protocol = customProtocol || v1Protocol;
                const bytes = buildMessage({
                    messages: this.messages,
                    name,
                    data,
                    protocol,
                    thpState,
                });
                const [_, chunkHeader] = protocol.getHeaders(bytes);

                const chunks = createChunks(
                    bytes,
                    chunkHeader,
                    this.api.nativeWriteChunking ? 0 : this.api.chunkSize,
                );
                let progress = 0;
                const apiWrite = (chunk: Buffer) => {
                    if (chunks.length > 1) {
                        progress++;
                        this.emit(TRANSPORT.SEND_MESSAGE_PROGRESS, progress / chunks.length);
                    }

                    return this.api.write(path, chunk, signal);
                };
                let sendResult;
                if (protocol.name === 'v2') {
                    sendResult = await sendThpMessage({
                        thpState,
                        skipAck: true,
                        chunks,
                        apiWrite,
                        apiRead: attemptSignal => this.api.read(path, attemptSignal || signal),
                        signal,
                        logger: this.logger,
                    });
                    thpState?.sync('send', name);
                } else {
                    sendResult = await sendChunks(chunks, apiWrite);
                }

                if (!sendResult.success) {
                    if (sendResult.error.code === ERRORS.DEVICE_DISCONNECTED_DURING_ACTION) {
                        this.enumerate();
                    }
                }

                return sendResult;
            },
            { signal, graceful: true, timeout },
        );
    }

    public receive({
        session,
        protocol: customProtocol,
        thpState,
        signal,
        timeout,
    }: AbstractTransportMethodParams<'receive'>) {
        return this.scheduleAction(
            async signal => {
                const getPathBySessionResponse = await this.sessionsClient.getPathBySession({
                    session,
                });
                if (!getPathBySessionResponse.success) {
                    return this.error({ error: getPathBySessionResponse.error.code });
                }
                const { path } = getPathBySessionResponse.payload;

                const apiRead = (attemptSignal?: AbortSignal) =>
                    this.api.read(path, attemptSignal || signal);

                const protocol = customProtocol || v1Protocol;
                if (protocol.name === 'v2') {
                    const decoded = await receiveThpMessage({
                        thpState,
                        skipAck: true,
                        apiWrite: (chunk, attemptSignal) =>
                            this.api.write(path, chunk, attemptSignal || signal),
                        apiRead,
                        signal,
                        logger: this.logger,
                    });

                    if (!decoded.success) {
                        return decoded;
                    }

                    const message = parseThpMessage({
                        messages: this.messages,
                        decoded: decoded.payload,
                        thpState,
                    });

                    return this.success(message);
                }

                const message = await receiveAndParse(this.messages, apiRead, protocol);

                if (!message.success) {
                    if (message.error.code === ERRORS.DEVICE_DISCONNECTED_DURING_ACTION) {
                        this.enumerate();
                    }
                }

                return message;
            },
            { signal, graceful: true, timeout },
        );
    }

    releaseDevice(session: Session) {
        return this.sessionsClient
            .getPathBySession({
                session,
            })
            .then(response => {
                if (response.success) {
                    return this.api.closeDevice(response.payload.path, { channel: 'read' });
                }

                return this.success(undefined);
            });
    }

    stop() {
        if (!this.stopped) {
            this.api.once('transport-interface-change', () => {
                this.logger?.debug('device connected after transport stopped, goodbye...');
            });
        }
        super.stop();
        // note:
        // not disposing sessionClient on purpose. on window reload, transport.stop is called. we do not want to clear sessions background data in this case because
        // there might be another client connected to it. When the last client disconnects, the background disposes itself.
        this.api.dispose();
    }
}
