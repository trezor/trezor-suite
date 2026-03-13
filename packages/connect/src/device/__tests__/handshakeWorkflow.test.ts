import { DataManager } from '../../data/DataManager';
import { parseConnectSettings } from '../../data/connectSettings';
import { initializeFirmwareConfig } from '../../data/firmwareInfo';
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
    transport.updateMessages(DataManager.getProtobufMessages());

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
        await DataManager.load(
            {
                ...parseConnectSettings({}),
            },
            true,
            true,
            initializeFirmwareConfig,
        );
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

    it('skipped. Device with features', async () => {
        const { device, abortController, transport } = await getAcquiredDevice();
        await device.getFeatures();

        const sendSpy = jest.spyOn(transport, 'send');
        await handshakeCancel({ device, signal: abortController.signal });

        expect(sendSpy).toHaveBeenCalledTimes(0);
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
