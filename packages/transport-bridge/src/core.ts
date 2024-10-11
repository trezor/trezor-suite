import { WebUSB } from 'usb';

import {
    v1 as protocolV1,
    v2 as protocolV2,
    thp as protocolThp,
    bridge as protocolBridge,
    TransportProtocol,
} from '@trezor/protocol';
import { receive as receiveUtil } from '@trezor/transport/src/utils/receive';
import { sendThpMessage, receiveThpMessage } from '@trezor/transport/src/thp';
import { createChunks, sendChunks } from '@trezor/transport/src/utils/send';
import { SessionsBackground } from '@trezor/transport/src/sessions/background';
import { SessionsClient } from '@trezor/transport/src/sessions/client';
import { UsbApi } from '@trezor/transport/src/api/usb';
import { UdpApi } from '@trezor/transport/src/api/udp';
import { AcquireInput, ReleaseInput } from '@trezor/transport/src/transports/abstract';
import { Session, BridgeProtocolMessage, PathInternal } from '@trezor/transport/src/types';
import { createProtocolMessage } from '@trezor/transport/src/utils/bridgeProtocolMessage';
import { Log } from '@trezor/utils';
import { AbstractApi } from '@trezor/transport/src/api/abstract';
import { success, unknownError } from '@trezor/transport/src/utils/result';

export const createCore = (apiArg: 'usb' | 'udp' | AbstractApi, logger?: Log) => {
    let api: AbstractApi;

    const sessionsBackground = new SessionsBackground();
    const sessionsClient = new SessionsClient(sessionsBackground);

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

    api.listen();

    // whenever low-level api reports changes to descriptors, report them to sessions module
    api.on('transport-interface-change', descriptors => {
        logger?.debug(`core: transport-interface-change ${JSON.stringify(descriptors)}`);
        sessionsClient.enumerateDone({ descriptors });
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
            chunkHeader = protocolV1.getChunkHeader(encodedMessage);
        } else {
            encodedMessage = buffer;
            chunkHeader = protocol.getChunkHeader(encodedMessage);
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
            descriptors: enumerateResult.payload,
        });

        return enumerateDoneResponse;
    };

    const acquire = async (
        acquireInput: Omit<AcquireInput, 'previous'> & {
            previous: Session | 'null';
            signal: AbortSignal;
        },
    ) => {
        const acquireIntentResult = await sessionsClient.acquireIntent({
            path: acquireInput.path,
            previous: acquireInput.previous === 'null' ? null : acquireInput.previous,
        });
        if (!acquireIntentResult.success) {
            return acquireIntentResult;
        }

        const openDeviceResult = await api.openDevice(
            acquireIntentResult.payload.path,
            true,
            acquireInput.signal,
        );
        logger?.debug(`core: openDevice: result: ${JSON.stringify(openDeviceResult)}`);

        if (!openDeviceResult.success) {
            return openDeviceResult;
        }
        await sessionsClient.acquireDone({ path: acquireInput.path });

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
    ) => {
        if (response.success) {
            const body = 'payload' in response ? response.payload : '';

            return {
                ...response,
                payload: createProtocolMessage(body, protocolName),
            };
        }

        return response;
    };

    const call = async ({
        session,
        data,
        signal,
        protocol: protocolName,
        state,
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
        let protocolState: protocolThp.ThpProtocolState;
        if (state) {
            protocolState = new protocolThp.ThpProtocolState();
            protocolState.deserialize(state);
        }

        const { path } = sessionsResult.payload;
        logger?.debug(`core: call: retrieved path ${path} for session ${session}`);

        return api.runInIsolation({ lock: { read: true, write: true }, path }, async () => {
            const openResult = await api.openDevice(path, false, signal);

            if (!openResult.success) {
                logger?.error(`core: call: api.openDevice error: ${openResult.error}`);

                return openResult;
            }
            logger?.debug(`core: call: api.openDevice done`);

            if (protocol.name === 'v2') {
                const b = Buffer.from(data, 'hex');
                const chunks = createChunks(b, protocol.getChunkHeader(b), api.chunkSize);
                protocolState?.setChannel(b.subarray(1, 3));

                const apiWrite = (chunk: Buffer, attemptSignal?: AbortSignal) =>
                    api.write(path, chunk, attemptSignal || signal);
                const apiRead = (attemptSignal?: AbortSignal) =>
                    api.read(path, attemptSignal || signal);

                const writeResult = await sendThpMessage({
                    protocolState,
                    chunks,
                    apiWrite,
                    apiRead,
                    signal,
                    logger,
                });
                if (!writeResult.success) {
                    return writeResult;
                }

                const message = await receiveThpMessage({
                    protocolState,
                    apiWrite,
                    apiRead,
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
        signal,
        protocol: protocolName,
        state,
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
        const { path } = sessionsResult.payload;
        const protocol = getProtocol(protocolName);
        if (state) {
            const protocolState = new protocolThp.ThpProtocolState();
            protocolState.deserialize(state);
        }

        const openResult = await api.openDevice(path, false, signal);
        if (!openResult.success) {
            return openResult;
        }

        if (protocol.name === 'v2') {
            const writeResult = await writeUtil({ path, data, signal, protocol });
            if (!writeResult.success) {
                return writeResult;
            }

            return createProtocolMessageResponse(writeResult, protocolName);
        }

        const writeResult = await writeUtil({ path, data, signal, protocol });

        return createProtocolMessageResponse(writeResult, protocolName);
    };

    const receive = async ({
        session,
        signal,
        protocol: protocolName,
        state,
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
        const { path } = sessionsResult.payload;
        const protocol = getProtocol(protocolName);

        return api.runInIsolation({ lock: { read: true, write: false }, path }, async () => {
            const openResult = await api.openDevice(path, false, signal);
            if (!openResult.success) {
                return openResult;
            }

            if (protocol.name === 'v2') {
                const protocolState = new protocolThp.ThpProtocolState();
                if (state) {
                    protocolState.deserialize(state);
                    protocolState.setExpectedResponse([0x04]); // TODO: get from the state
                }

                const apiWrite = (chunk: Buffer, attemptSignal?: AbortSignal) =>
                    api.write(path, chunk, attemptSignal || signal);
                const apiRead = (attemptSignal?: AbortSignal) =>
                    api.read(path, attemptSignal || signal);

                const message = await receiveThpMessage({
                    protocolState,
                    apiWrite,
                    apiRead,
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
                    protocolName,
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
