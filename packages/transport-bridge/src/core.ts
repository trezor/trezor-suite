import { WebUSB } from 'usb';

import { v1 as protocolV1, bridge as protocolBridge } from '@trezor/protocol';
import { receive as receiveUtil } from '@trezor/transport/src/utils/receive';
import { createChunks } from '@trezor/transport/src/utils/send';
import { SessionsBackground } from '@trezor/transport/src/sessions/background';
import { SessionsClient } from '@trezor/transport/src/sessions/client';
import { UsbApi } from '@trezor/transport/src/api/usb';
import { UdpApi } from '@trezor/transport/src/api/udp';
import { AcquireInput, ReleaseInput } from '@trezor/transport/src/transports/abstract';
import { Log } from '@trezor/utils';

const abortController = new AbortController();
export const sessionsBackground = new SessionsBackground({ signal: abortController.signal });

export const sessionsClient = new SessionsClient({
    requestFn: args => sessionsBackground.handleMessage(args),
    registerBackgroundCallbacks: () => {},
});

sessionsBackground.on('descriptors', descriptors => {
    sessionsClient.emit('descriptors', descriptors);
});

export const createApi = (apiStr: 'usb' | 'udp', logger?: Log) => {
    const api =
        apiStr === 'udp'
            ? new UdpApi({ logger })
            : new UsbApi({
                  logger,
                  usbInterface: new WebUSB({
                      allowAllDevices: true, // return all devices, not only authorized
                  }),
              });

    // whenever low-level api reports changes to descriptors, report them to sessions module
    api.on('transport-interface-change', descriptors => {
        sessionsClient.enumerateDone({ descriptors });
    });

    const writeUtil = async ({ path, data }: { path: string; data: string }) => {
        const { messageType, payload } = protocolBridge.decode(
            new Uint8Array(Buffer.from(data, 'hex')),
        );

        const encodedMessage = protocolV1.encode(payload, { messageType });
        const buffers = createChunks(
            encodedMessage,
            protocolV1.getChunkHeader(encodedMessage),
            api.chunkSize,
        );

        for (let i = 0; i < buffers.length; i++) {
            const bufferSegment = buffers[i];

            const result = await api.write(path, bufferSegment);
            if (!result.success) {
                return result;
            }
        }

        return { success: true as const };
    };

    const readUtil = async ({ path }: { path: string }) => {
        try {
            const { messageType, payload } = await receiveUtil(
                () =>
                    api.read(path).then(result => {
                        if (result.success) {
                            return result.payload;
                        }
                        throw new Error(result.error);
                    }),
                protocolV1,
            );

            return {
                success: true as const,
                payload: protocolBridge.encode(payload, { messageType }).toString('hex'),
            };
        } catch (err) {
            return { success: false as const, error: err.message as string };
        }
    };

    const enumerate = async () => {
        await sessionsClient.enumerateIntent();

        const enumerateResult = await api.enumerate();
        if (!enumerateResult.success) {
            return enumerateResult;
        }

        const enumerateDoneResponse = await sessionsClient.enumerateDone({
            descriptors: enumerateResult.payload,
        });

        return enumerateDoneResponse;
    };

    const acquire = async (acquireInput: AcquireInput) => {
        const acquireIntentResult = await sessionsClient.acquireIntent({
            path: acquireInput.path,
            previous: acquireInput.previous === 'null' ? null : acquireInput.previous,
        });
        if (!acquireIntentResult.success) {
            return acquireIntentResult;
        }

        const openDeviceResult = await api.openDevice(acquireInput.path, true);

        if (!openDeviceResult.success) {
            return openDeviceResult;
        }
        await sessionsClient.acquireDone({ path: acquireInput.path });

        return acquireIntentResult;
    };

    const release = async ({ session, path }: ReleaseInput) => {
        await sessionsClient.releaseIntent({ session });
        const sessionsResult = await sessionsClient.getPathBySession({
            session,
        });
        if (!sessionsResult.success) {
            return sessionsResult;
        }

        await api.closeDevice(path);

        return sessionsClient.releaseDone({ path: sessionsResult.payload.path });
    };

    const call = async ({ session, data }: { session: string; data: string }) => {
        const sessionsResult = await sessionsClient.getPathBySession({
            session,
        });
        if (!sessionsResult.success) {
            return sessionsResult;
        }
        const { path } = sessionsResult.payload;

        const openResult = await api.openDevice(path, false);
        if (!openResult.success) {
            return openResult;
        }

        const writeResult = await writeUtil({ path, data });
        if (!writeResult.success) {
            return writeResult;
        }

        return readUtil({ path });
    };

    const send = async ({ session, data }: { session: string; data: string }) => {
        const sessionsResult = await sessionsClient.getPathBySession({
            session,
        });

        if (!sessionsResult.success) {
            return sessionsResult;
        }
        const { path } = sessionsResult.payload;

        const openResult = await api.openDevice(path, false);
        if (!openResult.success) {
            return openResult;
        }

        return writeUtil({ path, data });
    };

    const receive = async ({ session }: { session: string }) => {
        const sessionsResult = await sessionsClient.getPathBySession({
            session,
        });

        if (!sessionsResult.success) {
            return sessionsResult;
        }
        const { path } = sessionsResult.payload;

        const openResult = await api.openDevice(path, false);
        if (!openResult.success) {
            return openResult;
        }

        return readUtil({ path });
    };

    return {
        enumerate,
        acquire,
        release,
        call,
        send,
        receive,
    };
};
