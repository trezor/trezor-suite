import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';

import { initializeFirmwareConfig } from '../../data/firmwareInfo';
import * as firmwareReleaseStore from '../../data/firmwareReleaseStore';
import { loadProtobufModules } from '../../data/protobufLoader';
import * as settingsStore from '../../data/settingsStore';
import { Device } from '../Device';
import { handshakeCancel } from '../workflow/handshake';

const { createTestTransport } = global.JestMocks;

const getAcquiredDevice = async (apiMethods: any = {}) => {
    let emitTransportEvent: (d: any[]) => void = () => {};
    const transport = createTestTransport({
        openDevice: () => {
            setTimeout(() => emitTransportEvent([{ path: '1', session: '1' }]), 100);

            return { success: true, payload: true };
        },
        on: (name: string, fn: typeof emitTransportEvent) => {
            if (name === 'transport-interface-change') {
                fn([{ path: '1', session: null }]);
                emitTransportEvent = fn;
            }
        },
        ...apiMethods,
    });

    await transport.init();
    await transport.enumerate();
    await transport.listen();

    const device = new Device({
        id: 'ABCD' as any, // any = DeviceUniquePath
        transport,
        descriptor: { path: '1' as any, type: 1, session: null, apiType: 'usb' }, // any = PathPublic
    });
    await device.acquire();

    const abortController = new AbortController();

    return { transport, device, abortController };
};

const fastForward = (time: number) => jest.advanceTimersByTimeAsync(time);

describe('workflow/handshake', () => {
    beforeAll(async () => {
        // todo: I don't get it. If we pass empty messages: {} (see getDeviceListParams), tests behave differently.
        const settings = { ...parseConnectSettings({}) };
        settingsStore.set(settings);
        await firmwareReleaseStore.init(settings.firmwareChannel, true, initializeFirmwareConfig);
        await loadProtobufModules();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('success at N-th read', async () => {
        let readAttempt = 0;
        const readMock = jest.fn(
            () =>
                new Promise(resolve => {
                    if (readAttempt >= 3) {
                        resolve({
                            success: true,
                            payload: Buffer.from('3f23230002000000060a046d656f77', 'hex'),
                        }); // Success
                    } else {
                        resolve({ success: true, payload: Buffer.alloc(readAttempt) });
                        readAttempt++;
                    }
                }),
        );
        jest.spyOn(console, 'error').mockImplementation(() => {});

        const { device, abortController } = await getAcquiredDevice({ read: readMock });
        await handshakeCancel({ device, signal: abortController.signal });

        expect(console.error).toHaveBeenCalledTimes(1); // empty buffer received at 1st read, console.error was called
        expect(readMock).toHaveBeenCalledTimes(4); // respond at 4th attempt
    });

    it('read timeout at N-th attempt', async () => {
        jest.useFakeTimers();

        let readAttempt = 0;
        const abortSpy = jest.fn();
        const readMock = jest.fn(
            (_, signal) =>
                new Promise(resolve => {
                    const timeout = setTimeout(
                        () => resolve({ success: true, payload: Buffer.alloc(readAttempt) }),
                        500 * readAttempt, // increase respond time on each attempt, should timeout on 3rd
                    );
                    signal.addEventListener('abort', () => {
                        abortSpy();
                        clearTimeout(timeout);
                        resolve({ success: false });
                    });
                    readAttempt++;
                }),
        );

        const { device, abortController } = await getAcquiredDevice({ read: readMock });
        const promise = handshakeCancel({ device, signal: abortController.signal });

        await fastForward(2000);
        await promise;

        expect(readMock).toHaveBeenCalledTimes(3);
        expect(abortSpy).toHaveBeenCalledTimes(1);
    });

    it('read aborted', async () => {
        jest.useFakeTimers();

        const abortSpy = jest.fn();
        const readMock = jest.fn(
            (_, signal) =>
                new Promise(resolve => {
                    const timeout = setTimeout(() => resolve({ success: false }), 2000);
                    signal.addEventListener('abort', () => {
                        abortSpy();
                        clearTimeout(timeout);
                        resolve({ success: false });
                    });
                }),
        );

        const { device, abortController } = await getAcquiredDevice({ read: readMock });
        const promise = handshakeCancel({ device, signal: abortController.signal });

        await fastForward(500);
        abortController.abort();
        await promise;

        expect(abortSpy).toHaveBeenCalledTimes(1);
        expect(readMock).toHaveBeenCalledTimes(1);
    });

    it('read attempts limit reached', async () => {
        const readMock = jest.fn(() => ({ success: true, payload: Buffer.alloc(10) }));

        const { device, abortController } = await getAcquiredDevice({ read: readMock });
        await handshakeCancel({ device, signal: abortController.signal });

        expect(readMock).toHaveBeenCalledTimes(10);
    });

    it('drains stale Failure_UnexpectedMessage before reading actual response', async () => {
        // T1B1 firmware (v1.14.1+) can leave a spontaneous Failure_UnexpectedMessage in the
        // transport buffer after some operations (e.g. resetDevice entropy check). That stale
        // message must be drained so the actual Cancel response is not left for initialize().
        //
        // Protocol frame: ?## (3f 23 23) + type BE u16 (00 03 = Failure) + len BE u32 + protobuf
        // Failure{code: UnexpectedMessage=1}: payload 08 01 → 3f23230003000000020801
        // Failure{code: ActionCancelled=4}:   payload 08 04 → 3f23230003000000020804
        const staleMessage = Buffer.from('3f23230003000000020801', 'hex');
        const cancelResponse = Buffer.from('3f23230003000000020804', 'hex');

        let readAttempt = 0;
        const readMock = jest.fn(() => {
            if (readAttempt === 0) {
                readAttempt++;

                return Promise.resolve({ success: true, payload: staleMessage });
            }

            return Promise.resolve({ success: true, payload: cancelResponse });
        });

        const { device, abortController, transport } = await getAcquiredDevice({ read: readMock });
        const sendSpy = jest.spyOn(transport, 'send');
        await handshakeCancel({ device, signal: abortController.signal, cancelNeeded: true });

        expect(sendSpy).toHaveBeenCalledTimes(1); // Cancel was sent
        expect(readMock).toHaveBeenCalledTimes(2); // stale drained, then actual response
    });

    it('skipped. Device with features on same ongoing session', async () => {
        const { device, abortController, transport } = await getAcquiredDevice();
        await device.getFeatures();

        const sendSpy = jest.spyOn(transport, 'send');
        await handshakeCancel({ device, signal: abortController.signal });

        expect(sendSpy).toHaveBeenCalledTimes(0);
    });

    it('NOT skipped. Device with features but freshly acquired session', async () => {
        // Simulates: previous call (e.g. resetDevice) left device.features set, then released
        // the session. Next call acquires a new session — Cancel must run to flush residual
        // transport state regardless of the cached features.
        const { device, abortController, transport } = await getAcquiredDevice();
        await device.getFeatures();

        const sendSpy = jest.spyOn(transport, 'send');
        await handshakeCancel({ device, signal: abortController.signal, cancelNeeded: true });

        expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('skipped. Device with protocol v2', async () => {
        const { device, abortController, transport } = await getAcquiredDevice();
        await device.getFeatures();

        const sendSpy = jest.spyOn(transport, 'send');
        await handshakeCancel({ device, signal: abortController.signal });

        expect(sendSpy).toHaveBeenCalledTimes(0);
    });

    it('send timeout', async () => {
        jest.useFakeTimers();

        const abortSpy = jest.fn();
        const writeMock = jest.fn(
            (_a, _b, signal) =>
                new Promise(resolve => {
                    const timeout = setTimeout(() => resolve({ success: false }), 2000);
                    signal.addEventListener('abort', () => {
                        abortSpy();
                        clearTimeout(timeout);
                        resolve({ success: false });
                    });
                }),
        );
        const readMock = jest.fn();

        const { device, abortController } = await getAcquiredDevice({
            write: writeMock,
            read: readMock,
        });
        const promise = handshakeCancel({ device, signal: abortController.signal });

        await fastForward(2000);
        await promise;

        expect(writeMock).toHaveBeenCalledTimes(1);
        expect(abortSpy).toHaveBeenCalledTimes(1);
        expect(readMock).toHaveBeenCalledTimes(0);
    });

    it('send aborted', async () => {
        jest.useFakeTimers();

        const abortSpy = jest.fn();
        const writeMock = jest.fn(
            (_a, _b, signal) =>
                new Promise(resolve => {
                    const timeout = setTimeout(() => resolve({ success: false }), 2000);
                    signal.addEventListener('abort', () => {
                        abortSpy();
                        clearTimeout(timeout);
                        resolve({ success: false });
                    });
                }),
        );
        const readMock = jest.fn();

        const { device } = await getAcquiredDevice({ write: writeMock, read: readMock });
        const abortController = new AbortController();
        const promise = handshakeCancel({ device, signal: abortController.signal });

        await fastForward(500);
        abortController.abort();
        await promise;

        expect(writeMock).toHaveBeenCalledTimes(1);
        expect(abortSpy).toHaveBeenCalledTimes(1);
        expect(readMock).toHaveBeenCalledTimes(0);
    });
});
