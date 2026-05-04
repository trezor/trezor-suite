import { WebUSB, usb } from 'usb';

import {
    type TransportProtocol,
    bridge as protocolBridge,
    thp as protocolThp,
    v1 as protocolV1,
    v2 as protocolV2,
} from '@trezor/protocol';
import { UdpApi } from '@trezor/transport/src/api/udp';
import {
    type AbstractApi,
    type AcquireInput,
    type BridgeProtocolMessage,
    type DescriptorApiLevel,
    type PathInternal,
    type ReleaseInput,
    type Session,
    UsbApi,
} from '@trezor/transport-abstract';
import { THP_STATE_ERROR } from '@trezor/transport-abstract/src/errors';
import { SessionsBackground } from '@trezor/transport-abstract/src/sessions/background';
import { SessionsClient } from '@trezor/transport-abstract/src/sessions/client';
import {
    callThpMessage,
    receiveThpMessage,
    sendThpMessage,
} from '@trezor/transport-abstract/src/thp';
import { createProtocolMessage } from '@trezor/transport-abstract/src/utils/bridgeProtocolMessage';
import { receive as receiveUtil } from '@trezor/transport-abstract/src/utils/receive';
import { error, success, unknownError } from '@trezor/transport-abstract/src/utils/result';
import { createChunks, sendChunks } from '@trezor/transport-abstract/src/utils/send';
import { type Log } from '@trezor/utils';

export const createCore = (apiArg: 'usb' | 'udp' | AbstractApi, logger?: Log) => {
    let api: AbstractApi;

    const sessionsBackground = new SessionsBackground();
    const sessionsClient = new SessionsClient(sessionsBackground);

    if (apiArg === 'usb' && logger?.enabled) {
        // https://libusb.sourceforge.io/api-1.0/group__libusb__lib.html#ga2d6144203f0fc6d373677f6e2e89d2d2
        usb.setDebugLevel(1); // Level 3 would probably be ok as well (doesn't seem too spammy). For full debugging use 4.
    }

    if (typeof apiArg === 'string') {
        api =
            apiArg === 'udp'
                ? new UdpApi({ logger })
                : new UsbApi({
                      logger,
                      usbInterface: new WebUSB({
                          allowAllDevices: true, // return all devices, not only authorized
                      }),

                      // todo: possibly only for windows
                      forceReadSerialOnConnect: true,
                  });
    } else {
        api = apiArg;
    }

    // Descriptors from node-bridge should always have apiType usb in order to be consistent with BridgeTransport.apiType
    const transformApiType = (descriptor: DescriptorApiLevel): DescriptorApiLevel => ({
        ...descriptor,
        apiType: 'usb',
    });

    api.listen();

    // whenever low-level api reports changes to descriptors, report them to sessions module
    api.on('transport-interface-change', descriptors => {
        logger?.debug(`core: transport-interface-change ${JSON.stringify(descriptors)}`);
        sessionsClient.enumerateDone({ descriptors: descriptors.map(transformApiType) });
    });
    const writeUtil = async ({
        path,
        data,
        signal,
        protocol,
    }: {
        path: PathInternal;
        data: string;
        signal: AbortSignal;
        protocol: TransportProtocol;
    }) => {
        logger?.debug(`core: writeUtil protocol ${protocol.name}`);
        const buffer = Buffer.from(data, 'hex');
        let encodedMessage;
        let chunkHeader;
        if (protocol.name === 'bridge') {
            const { messageType, payload } = protocolBridge.decode(buffer);
            encodedMessage = protocolV1.encode(payload, { messageType });
            [, chunkHeader] = protocolV1.getHeaders(encodedMessage);
        } else {
            encodedMessage = buffer;
            [, chunkHeader] = protocol.getHeaders(encodedMessage);
        }

        const chunks = createChunks(encodedMessage, chunkHeader, api.chunkSize);
        const apiWrite = (chunk: Buffer) => api.write(path, chunk, signal);
        const sendResult = await sendChunks(chunks, apiWrite);

        return sendResult;
    };

    const readUtil = async ({
        path,
        signal,
        protocol,
    }: {
        path: PathInternal;
        signal: AbortSignal;
        protocol: TransportProtocol;
    }) => {
        logger?.debug(`core: readUtil protocol ${protocol.name}`);
        try {
            const receiveProtocol = protocol.name === 'bridge' ? protocolV1 : protocol;
            const res = await receiveUtil(() => api.read(path, signal), receiveProtocol);
            if (!res.success) return res;
            const { messageType, payload } = res.payload;
            logger?.debug(
                `core: readUtil result: messageType: ${messageType} byteLength: ${payload?.byteLength}`,
            );

            return success(protocol.encode(payload, { messageType }).toString('hex'));
        } catch (err) {
            logger?.debug(`core: readUtil catch: ${err.message}`);

            return unknownError(err);
        }
    };

    const enumerate = async ({ signal }: { signal: AbortSignal }) => {
        const enumerateResult = await api.enumerate(signal);

        if (!enumerateResult.success) {
            return enumerateResult;
        }

        const enumerateDoneResponse = await sessionsClient.enumerateDone({
            descriptors: enumerateResult.payload.map(transformApiType),
        });

        return enumerateDoneResponse;
    };

    const acquire = async (
        acquireInput: Omit<AcquireInput, 'previous'> & {
            previous: Session | 'null';
            signal: AbortSignal;
        } & { sessionOwner: string },
    ) => {
        const acquireIntentResult = await sessionsClient.acquireIntent({
            path: acquireInput.path,
            previous: acquireInput.previous === 'null' ? null : acquireInput.previous,
        });
        if (!acquireIntentResult.success) {
            return acquireIntentResult;
        }

        const openDeviceResult = await api.openDevice(acquireIntentResult.payload.path, {
            reset: acquireInput.previous !== 'null',
            signal: acquireInput.signal,
        });
        logger?.debug(`core: openDevice: result: ${JSON.stringify(openDeviceResult)}`);

        if (!openDeviceResult.success) {
            return openDeviceResult;
        }
        await sessionsClient.acquireDone({
            path: acquireInput.path,
            sessionOwner: acquireInput.sessionOwner,
        });

        return acquireIntentResult;
    };

    const release = async ({ session }: Omit<ReleaseInput, 'path'>) => {
        await sessionsClient.releaseIntent({ session });

        const sessionsResult = await sessionsClient.getPathBySession({
            session,
        });

        if (!sessionsResult.success) {
            return sessionsResult;
        }

        const closeRes = await api.closeDevice(sessionsResult.payload.path);

        if (!closeRes.success) {
            logger?.error(`core: release: api.closeDevice error: ${closeRes.error}`);
        }

        return sessionsClient.releaseDone({ path: sessionsResult.payload.path });
    };

    const getProtocol = (protocolName: BridgeProtocolMessage['protocol']) => {
        if (protocolName === 'v1') {
            return protocolV1;
        }

        if (protocolName === 'v2') {
            return protocolV2;
        }

        return protocolBridge;
    };

    const createProtocolMessageResponse = (
        response: Awaited<ReturnType<typeof readUtil>> | Awaited<ReturnType<typeof writeUtil>>,
        protocolName: BridgeProtocolMessage['protocol'],
        thpState?: BridgeProtocolMessage['thpState'],
    ) => {
        if (response.success) {
            const body = 'payload' in response ? response.payload : '';

            return {
                ...response,
                payload: createProtocolMessage(body, protocolName, thpState),
            };
        }

        return response;
    };

    const call = async ({
        session,
        data,
        protocol: protocolName,
        signal,
        thpState,
    }: BridgeProtocolMessage & {
        session: Session;
        signal: AbortSignal;
    }) => {
        logger?.debug(`core: call: session: ${session} ${protocolName}`);
        const sessionsResult = await sessionsClient.getPathBySession({
            session,
        });
        if (!sessionsResult.success) {
            logger?.error(`core: call: retrieving path error: ${sessionsResult.error}`);

            return sessionsResult;
        }
        const protocol = getProtocol(protocolName);
        const { path } = sessionsResult.payload;
        logger?.debug(`core: call: retrieved path ${path} for session ${session}`);

        return api.runInIsolation({ lock: { read: true, write: true }, path }, async () => {
            logger?.debug('core: call: writeUtil');

            if (protocol.name === 'v2') {
                if (!thpState) {
                    return error({ code: THP_STATE_ERROR, message: 'ThpStateMissing' });
                }

                const state = new protocolThp.ThpState();
                state.deserialize(thpState);

                const bytes = Buffer.from(data, 'hex');
                const [, chunkHeader] = protocol.getHeaders(bytes);
                const chunks = createChunks(bytes, chunkHeader, api.chunkSize);

                const apiWrite = (chunk: Buffer, attemptSignal?: AbortSignal) =>
                    api.write(path, chunk, attemptSignal || signal);

                const message = await callThpMessage({
                    thpState: state,
                    chunks,
                    apiWrite,
                    apiRead: attemptSignal => api.read(path, attemptSignal || signal),
                    signal,
                    logger,
                });
                if (!message.success) {
                    return message;
                }

                return createProtocolMessageResponse(
                    {
                        success: true,
                        payload: protocol
                            .encode(message.payload.payload, message.payload)
                            .toString('hex'),
                    },
                    protocol.name,
                    state.serialize(),
                );
            }

            const writeResult = await writeUtil({ path, data, signal, protocol });
            if (!writeResult.success) {
                logger?.error(`core: call: writeUtil ${writeResult.error}`);

                return writeResult;
            }
            logger?.debug('core: call: readUtil');
            const readResult = await readUtil({ path, signal, protocol });

            return createProtocolMessageResponse(readResult, protocolName);
        });
    };

    const send = async ({
        session,
        data,
        protocol: protocolName,
        signal,
        thpState,
    }: BridgeProtocolMessage & {
        session: Session;
        signal: AbortSignal;
    }) => {
        const sessionsResult = await sessionsClient.getPathBySession({
            session,
        });

        if (!sessionsResult.success) {
            return sessionsResult;
        }
        const protocol = getProtocol(protocolName);
        const { path } = sessionsResult.payload;
        if (protocol.name === 'v2') {
            if (!thpState) {
                return error({ code: THP_STATE_ERROR, message: 'ThpStateMissing' });
            }

            const state = new protocolThp.ThpState();
            state.deserialize(thpState);

            const bytes = Buffer.from(data, 'hex');
            const [, chunkHeader] = protocol.getHeaders(bytes);
            const chunks = createChunks(bytes, chunkHeader, api.chunkSize);

            const writeResult = await sendThpMessage({
                thpState: state,
                chunks,
                apiWrite: (chunk, attemptSignal) => api.write(path, chunk, attemptSignal || signal),
                apiRead: attemptSignal => api.read(path, attemptSignal || signal),
                signal,
                logger,
                skipAck: true,
            });

            if (!writeResult.success) {
                return writeResult;
            }

            return createProtocolMessageResponse(writeResult, protocolName, state.serialize());
        }

        const writeResult = await writeUtil({ path, data, signal, protocol });

        return createProtocolMessageResponse(writeResult, protocolName);
    };

    const receive = async ({
        session,
        protocol: protocolName,
        signal,
        thpState,
    }: BridgeProtocolMessage & {
        session: Session;
        signal: AbortSignal;
    }) => {
        const sessionsResult = await sessionsClient.getPathBySession({
            session,
        });

        if (!sessionsResult.success) {
            return sessionsResult;
        }
        const protocol = getProtocol(protocolName);
        const { path } = sessionsResult.payload;

        return api.runInIsolation({ lock: { read: true, write: false }, path }, async () => {
            if (protocol.name === 'v2') {
                if (!thpState) {
                    return error({ code: THP_STATE_ERROR, message: 'ThpStateMissing' });
                }

                const state = new protocolThp.ThpState();
                state.deserialize(thpState);

                const message = await receiveThpMessage({
                    thpState: state,
                    apiWrite: (chunk, attemptSignal) =>
                        api.write(path, chunk, attemptSignal || signal),
                    apiRead: attemptSignal => api.read(path, attemptSignal || signal),
                    signal,
                    logger,
                    skipAck: true,
                });
                if (!message.success) {
                    return message;
                }

                return createProtocolMessageResponse(
                    {
                        success: true,
                        payload: protocol
                            .encode(message.payload.payload, message.payload)
                            .toString('hex'),
                    },
                    protocolName,
                    state.serialize(),
                );
            }

            const readResult = await readUtil({ path, signal, protocol });

            return createProtocolMessageResponse(readResult, protocolName);
        });
    };

    const dispose = () => {
        sessionsBackground.dispose();
        api.dispose();
        sessionsClient.dispose();
    };

    return {
        enumerate,
        acquire,
        release,
        call,
        send,
        receive,
        dispose,
        sessionsClient,
    };
};
