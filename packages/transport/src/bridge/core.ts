import { WebUSB } from 'usb';

import { v1 as protocolV1, bridge as protocolBridge } from '@trezor/protocol';

import { receive as receiveUtil } from '../utils/receive';
import { SessionsBackground } from '../sessions/background';
import { SessionsClient } from '../sessions/client';
import { UsbApi } from '../api/usb';
import { AcquireInput, ReleaseInput } from '../transports/abstract';

export const sessionsBackground = new SessionsBackground();

// todo: here we should have MultiApi
export const api = new UsbApi({
    usbInterface: new WebUSB({
        allowAllDevices: true, // return all devices, not only authorized
    }),
});

export const sessionsClient = new SessionsClient({
    requestFn: args => sessionsBackground.handleMessage(args),
    registerBackgroundCallbacks: () => {},
});

sessionsBackground.on('descriptors', descriptors => {
    sessionsClient.emit('descriptors', descriptors);
});

// whenever low-level api reports changes to descriptors, report them to sessions module
api.on('transport-interface-change', paths => {
    sessionsClient.enumerateDone({ paths });
});

const writeUtil = async ({ path, data }: { path: string; data: string }) => {
    const { typeId, buffer: restBuffer } = protocolBridge.decode(
        new Uint8Array(Buffer.from(data, 'hex')),
    );

    const buffers = protocolV1.encode(restBuffer, {
        messageType: typeId,
    });

    for (let i = 0; i < buffers.length; i++) {
        const bufferSegment = buffers[i];
        await api.write(path, bufferSegment);
    }
};

const readUtil = async ({ path }: { path: string }) => {
    try {
        const message = await receiveUtil(
            () =>
                api.read(path).then(result => {
                    if (result.success) {
                        return result.payload;
                    }
                    throw new Error(result.error);
                }),
            protocolV1.decode,
        );
        return protocolBridge
            .encode(message.buffer, { messageType: message.typeId })[0]
            .toString('hex');
    } catch (err) {
        return { success: false as const, error: err.message };
    }
};

export const enumerate = async () => {
    await sessionsClient.enumerateIntent();

    const enumerateResult = await api.enumerate();
    if (!enumerateResult.success) {
        return enumerateResult;
    }
    return sessionsClient.enumerateDone({ paths: enumerateResult.payload });
};

export const acquire = async (acquireInput: AcquireInput) => {
    const acquireIntentResult = await sessionsClient.acquireIntent({
        path: acquireInput.path,
        previous: acquireInput.previous === 'null' ? null : acquireInput.previous,
    });
    if (!acquireIntentResult.success) {
        return acquireIntentResult;
    }
    await sessionsClient.acquireDone({ path: acquireInput.path });

    return acquireIntentResult;
};

export const release = async ({ session, path }: ReleaseInput) => {
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

export const call = async ({ session, data }: { session: string; data: string }) => {
    const sessionsResult = await sessionsClient.getPathBySession({
        session,
    });
    if (!sessionsResult.success) {
        return sessionsResult;
    }
    const { path } = sessionsResult.payload;
    await api.openDevice(path, false);
    await writeUtil({ path, data });
    const message = await readUtil({ path });
    return { success: true as const, payload: message };
};

export const send = async ({ session, data }: { session: string; data: string }) => {
    const sessionsResult = await sessionsClient.getPathBySession({
        session,
    });

    if (!sessionsResult.success) {
        return sessionsResult;
    }
    const { path } = sessionsResult.payload;

    await api.openDevice(path, false);
    await writeUtil({ path, data });
    return { success: true as const };
};

export const receive = async ({ session }: { session: string }) => {
    const sessionsResult = await sessionsClient.getPathBySession({
        session,
    });

    if (!sessionsResult.success) {
        return sessionsResult;
    }
    const { path } = sessionsResult.payload;

    await api.openDevice(path, false);

    const message = await readUtil({ path });

    return { success: true as const, payload: message };
};
