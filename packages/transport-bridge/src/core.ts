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
    TRANSPORT_ERROR as ERRORS,
    type PathInternal,
    type ReleaseInput,
    type Session,
    SessionsBackground,
    SessionsClient,
    UsbApi,
    callThpMessage,
    createChunks,
    createProtocolMessage,
    error,
    receiveThpMessage,
    receive as receiveUtil,
    sendChunks,
    sendThpMessage,
    success,
    unknownError,
} from '@trezor/transport-common';
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
        // `data` comes straight from the (untrusted) /post request body. protocolBridge.decode
        // throws PROTOCOL_MALFORMED on a payload shorter than the 6-byte header, and getHeaders/
        // encode can also throw on malformed input. `call`/`receive` reach writeUtil inside
        // api.runInIsolation (which try/catches → unknownError), but `send`'s bridge/v1 tail is
        // NOT wrapped in runInIsolation (unlike its v2 branch, guarded since iter21) and the
        // http.ts /post `.then()` chain has no `.catch()`, so an escaping throw becomes an
        // unhandled rejection that crashes the bridge utility process (device-comm DoS). Guard
        // the body directly, mirroring the sibling readUtil.
        try {
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
            const apiWrite = (chunk: Buffer) => api.write(path, chunk, { signal });
            const sendResult = await sendChunks(chunks, apiWrite);

            return sendResult;
        } catch (err) {
            logger?.debug(`core: writeUtil catch: ${err.message}`);

            return unknownError(err);
        }
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
            const res = await receiveUtil(() => api.read(path, { signal }), receiveProtocol);
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
        // api.enumerate performs device I/O (e.g. the `usb` library) which can throw
        // on hardware/driver errors. The http.ts /enumerate and /status-data handlers
        // float this promise with no `.catch()`, and the bridge utility process installs
        // no unhandledRejection handler, so an uncaught throw here crashes the whole
        // bridge (device-communication DoS). Convert it to a structured error instead,
        // mirroring the runInIsolation/`send` guard on the sibling core methods.
        let enumerateResult;
        try {
            enumerateResult = await api.enumerate(signal);
        } catch (err) {
            return unknownError(err);
        }

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

        // api.openDevice performs device I/O and can throw on hardware/driver errors.
        // Convert a throw into the same structured failure the guard below already
        // handles, so (a) the acquireIntent lock is still released via acquireDone(abort)
        // instead of leaking (device wedges → every later acquire deadlocks), and
        // (b) the throw does not escape as an unhandled rejection out of the http.ts
        // /acquire chain (which has no `.catch()`) and crash the bridge utility process.
        let openDeviceResult;
        try {
            openDeviceResult = await api.openDevice(acquireIntentResult.payload.path, {
                reset: acquireInput.previous !== 'null',
                signal: acquireInput.signal,
            });
        } catch (err) {
            openDeviceResult = unknownError(err);
        }
        logger?.debug(`core: openDevice: result: ${JSON.stringify(openDeviceResult)}`);

        if (!openDeviceResult.success) {
            // release the lock taken by acquireIntent without committing a session,
            // otherwise the device is locked forever and every later acquire deadlocks
            await sessionsClient.acquireDone({ path: acquireInput.path, abort: true });

            return openDeviceResult;
        }
        await sessionsClient.acquireDone({
            path: acquireInput.path,
            sessionOwner: acquireInput.sessionOwner,
        });

        return acquireIntentResult;
    };

    const release = async ({ session }: Omit<ReleaseInput, 'path'>) => {
        const releaseIntentResult = await sessionsClient.releaseIntent({ session });

        // on failure releaseIntent already freed the lock (or never took it); use
        // the path it returned instead of a second getPathBySession lookup, which
        // could race and leak the held lock when it fails.
        if (!releaseIntentResult.success) {
            return releaseIntentResult;
        }

        const { path } = releaseIntentResult.payload;

        // api.closeDevice performs device I/O and can throw on hardware/driver errors.
        // A throw here would skip releaseDone below (leaking the session lock → deadlock)
        // and escape as an unhandled rejection out of the http.ts /release chain (no
        // `.catch()`), crashing the bridge utility process. Treat a throw like a failed
        // closeDevice so releaseDone still runs and the lock is freed.
        let closeRes;
        try {
            closeRes = await api.closeDevice(path);
        } catch (err) {
            closeRes = unknownError(err);
        }

        if (!closeRes.success) {
            logger?.error(`core: release: api.closeDevice error: ${closeRes.error}`);
        }

        // always reached, even when closeDevice failed, so the lock is freed
        return sessionsClient.releaseDone({ path });
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
                    return error({ code: ERRORS.THP_STATE_ERROR, message: 'ThpStateMissing' });
                }

                const state = new protocolThp.ThpState();
                state.deserialize(thpState);

                const bytes = Buffer.from(data, 'hex');
                const [, chunkHeader] = protocol.getHeaders(bytes);
                const chunks = createChunks(bytes, chunkHeader, api.chunkSize);

                const message = await callThpMessage({
                    thpState: state,
                    chunks,
                    apiWrite: (chunk, options) =>
                        api.write(path, chunk, {
                            ...options,
                            signal: options?.signal || signal,
                        }),
                    apiRead: options =>
                        api.read(path, { ...options, signal: options?.signal || signal }),
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
                return error({ code: ERRORS.THP_STATE_ERROR, message: 'ThpStateMissing' });
            }

            // `thpState` and `data` come straight from the (untrusted) request body, so a malformed
            // state or non-decodable payload must resolve to a structured error instead of throwing
            // out of this promise. Unlike `call`/`receive`, `send` is not wrapped in `runInIsolation`,
            // so without this guard an unhandled rejection would crash the bridge (device-comm DoS).
            let state: InstanceType<typeof protocolThp.ThpState>;
            let bytes: Buffer;
            let chunkHeader: Buffer;
            try {
                state = new protocolThp.ThpState();
                state.deserialize(thpState);

                bytes = Buffer.from(data, 'hex');
                [, chunkHeader] = protocol.getHeaders(bytes);
            } catch (err) {
                logger?.error(`core: send: invalid v2 message: ${err.message}`);

                return unknownError(err);
            }
            const chunks = createChunks(bytes, chunkHeader, api.chunkSize);

            const writeResult = await sendThpMessage({
                thpState: state,
                chunks,
                apiWrite: (chunk, options) =>
                    api.write(path, chunk, { ...options, signal: options?.signal || signal }),
                apiRead: options =>
                    api.read(path, { ...options, signal: options?.signal || signal }),
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
                    return error({ code: ERRORS.THP_STATE_ERROR, message: 'ThpStateMissing' });
                }

                const state = new protocolThp.ThpState();
                state.deserialize(thpState);

                const message = await receiveThpMessage({
                    thpState: state,
                    apiWrite: (chunk, options) =>
                        api.write(path, chunk, {
                            ...options,
                            signal: options?.signal || signal,
                        }),
                    apiRead: options =>
                        api.read(path, { ...options, signal: options?.signal || signal }),
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
