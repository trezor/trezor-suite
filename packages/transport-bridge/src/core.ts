import type { Log } from '@trezor/logger';
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
    DEVICE_TYPE,
    type Descriptor,
    type DescriptorApiLevel,
    TRANSPORT_ERROR as ERRORS,
    type PathInternal,
    type ReleaseInput,
    type Session,
    SessionsBackground,
    SessionsClient,
    UsbApi,
    UsbApiLegacy,
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

import { CompositeApi } from './api/composite';
import { HidApi } from './api/hid';

type CreateCoreOptions = {
    /**
     * Adds a lazily enabled HID api for HID-only Trezor One devices (534c:0001). Such devices
     * and their sessions are then served only to callers that pass `isHidAllowed`.
     */
    hid?: boolean;
};

export const createCore = (
    apiArg: 'legacy' | 'nusb' | 'udp' | AbstractApi,
    logger?: Log,
    { hid = false }: CreateCoreOptions = {},
) => {
    let api: AbstractApi;

    const sessionsBackground = new SessionsBackground();
    const sessionsClient = new SessionsClient(sessionsBackground);

    if (typeof apiArg === 'string') {
        if (apiArg === 'udp') {
            api = new UdpApi({ logger });
        } else if (apiArg === 'legacy') {
            // Lazy-require so only the SELECTED native usb addon is ever loaded - never both at
            // once, which would make libusb (2.x) and nusb (3.x) contend for the same device.
            const { WebUSB, usb } = require('usb-legacy');
            if (logger?.enabled) {
                // https://libusb.sourceforge.io/api-1.0/group__libusb__lib.html#ga2d6144203f0fc6d373677f6e2e89d2d2
                usb.setDebugLevel(1);
            }
            // usb 2.x runs the frozen, battle-tested UsbApiLegacy - a self-contained escape hatch
            // that stays independent of the usb 3.x UsbApi so a nusb-side change can never regress it.
            api = new UsbApiLegacy({
                logger,
                usbInterface: new WebUSB({ allowAllDevices: true }), // all devices, not only authorized
                forceReadSerialOnConnect: true, // todo: possibly only for windows
            });
        } else {
            // 'nusb' = usb 3.x (node-usb-rs). Every caller names its implementation explicitly, so
            // that a staged migration can never switch an artifact over by accident.
            const { WebUSB } = require('usb');
            api = new UsbApi({
                logger,
                usbInterface: new WebUSB({ allowAllDevices: true }), // all devices, not only authorized
            });
        }
    } else {
        api = apiArg;
    }

    if (hid && apiArg !== 'udp' && !(api instanceof CompositeApi)) {
        api = new CompositeApi({
            logger,
            usbApi: api,
            // Lazy-require, the addon is loaded only when a client allowed to use HID shows up.
            createHidApi: () => new HidApi({ logger, nodeHid: require('node-hid') }),
        });
    }
    const compositeApi = api instanceof CompositeApi ? api : undefined;

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
        const apiWrite = (chunk: Buffer) => api.write(path, chunk, { signal });
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

    const findDescriptor = async (predicate: (descriptor: Descriptor) => boolean) => {
        const sessionsResult = await sessionsClient.getSessions();

        return sessionsResult.success
            ? sessionsResult.payload.descriptors.find(predicate)
            : undefined;
    };

    const isHidDescriptor = (descriptor?: Descriptor) => descriptor?.type === DEVICE_TYPE.TypeT1Hid;

    /**
     * HID-only devices keep the PIN and passphrase of the previous owner unlocked, so a session
     * on such a device must stay out of reach of every caller that is not allowed to use HID.
     */
    const isHidSessionDenied = async (session: Session, isHidAllowed?: boolean) =>
        !!compositeApi &&
        !isHidAllowed &&
        isHidDescriptor(await findDescriptor(descriptor => descriptor.session === session));

    const enableHid = () => compositeApi?.enableHid() ?? Promise.resolve(false);

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
        } & { sessionOwner: string; isHidAllowed?: boolean },
    ) => {
        if (
            compositeApi &&
            !acquireInput.isHidAllowed &&
            isHidDescriptor(
                await findDescriptor(descriptor => descriptor.path === acquireInput.path),
            )
        ) {
            // The same answer libusb gives for a HID-only device, clients show it as unreadable.
            return error({ code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE });
        }

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

    const release = async ({
        session,
        isHidAllowed,
    }: Omit<ReleaseInput, 'path'> & { isHidAllowed?: boolean }) => {
        if (await isHidSessionDenied(session, isHidAllowed)) {
            return error({ code: ERRORS.SESSION_NOT_FOUND });
        }

        const releaseIntentResult = await sessionsClient.releaseIntent({ session });

        // on failure releaseIntent already freed the lock (or never took it); use
        // the path it returned instead of a second getPathBySession lookup, which
        // could race and leak the held lock when it fails.
        if (!releaseIntentResult.success) {
            return releaseIntentResult;
        }

        const { path } = releaseIntentResult.payload;

        const closeRes = await api.closeDevice(path);

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
        isHidAllowed,
    }: BridgeProtocolMessage & {
        session: Session;
        signal: AbortSignal;
        isHidAllowed?: boolean;
    }) => {
        logger?.debug(`core: call: session: ${session} ${protocolName}`);
        if (await isHidSessionDenied(session, isHidAllowed)) {
            return error({ code: ERRORS.SESSION_NOT_FOUND });
        }

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
        isHidAllowed,
    }: BridgeProtocolMessage & {
        session: Session;
        signal: AbortSignal;
        isHidAllowed?: boolean;
    }) => {
        if (await isHidSessionDenied(session, isHidAllowed)) {
            return error({ code: ERRORS.SESSION_NOT_FOUND });
        }

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

            const state = new protocolThp.ThpState();
            state.deserialize(thpState);

            const bytes = Buffer.from(data, 'hex');
            const [, chunkHeader] = protocol.getHeaders(bytes);
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
        isHidAllowed,
    }: BridgeProtocolMessage & {
        session: Session;
        signal: AbortSignal;
        isHidAllowed?: boolean;
    }) => {
        if (await isHidSessionDenied(session, isHidAllowed)) {
            return error({ code: ERRORS.SESSION_NOT_FOUND });
        }

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
        enableHid,
        isHidSessionDenied,
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
