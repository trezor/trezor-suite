import { EventEmitter } from 'events';

import { ERRORS } from '@trezor/connect-common';
import { noopCreateLogger } from '@trezor/logger';
import { TRANSPORT, type Transport } from '@trezor/transport-common';
import { type Deferred, createDeferred } from '@trezor/utils';

import { Device } from './Device';

type ReleaseResult = { success: true; payload: null };

const PATH = '1';

const createFakeTransport = () => {
    const deviceEvents = new EventEmitter();
    let currentSession: string | null = null;
    let sessionCounter = 0;
    const pendingReleases: Deferred<ReleaseResult>[] = [];

    const emitSessionChanged = (session: string | null) => {
        currentSession = session;
        deviceEvents.emit(PATH, {
            type: TRANSPORT.DEVICE_SESSION_CHANGED,
            descriptor: { path: PATH, session },
        });
    };

    const acquire = jest.fn(() => {
        const session = `${++sessionCounter}`;
        setTimeout(() => emitSessionChanged(session), 0);

        return Promise.resolve({ success: true, payload: session });
    });

    const release = jest.fn(async () => {
        const releaseResult = createDeferred<ReleaseResult>();
        pendingReleases.push(releaseResult);
        const result = await releaseResult.promise;
        setTimeout(() => emitSessionChanged(null), 0);

        return result;
    });

    const transport = {
        name: 'TestTransport',
        on: jest.fn(),
        off: jest.fn(),
        deviceEvents,
        getDescriptor: () => ({ path: PATH, session: currentSession }),
        acquire,
        release,
        releaseDevice: jest.fn(),
        releaseSync: jest.fn(),
    } as unknown as Transport;

    const resolveRelease = () => pendingReleases.shift()?.resolve({ success: true, payload: null });

    return { transport, acquire, release, resolveRelease };
};

const createDevice = (transport: Transport) =>
    new Device({
        id: 'ABCD' as any, // any = DeviceUniquePath
        transport,
        descriptor: { path: PATH as any, type: 1, session: null, apiType: 'usb' }, // any = PathPublic
        createLogger: noopCreateLogger,
    });

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Device transport session', () => {
    it('acquires and releases the session', async () => {
        const { transport, resolveRelease } = createFakeTransport();
        const device = createDevice(transport);

        await device.acquire();
        expect(device.isUsedHere()).toBe(true);

        const release = device.release();
        resolveRelease();
        await release;

        expect(device.isUsedHere()).toBe(false);
    });

    it('returns the pending release to every caller', async () => {
        const { transport, release, resolveRelease } = createFakeTransport();
        const device = createDevice(transport);
        await device.acquire();

        const firstRelease = device.release();
        const secondRelease = device.release();

        expect(secondRelease).toBe(firstRelease);
        expect(release).toHaveBeenCalledTimes(1);

        resolveRelease();
        await secondRelease;
        expect(device.isUsedHere()).toBe(false);
    });

    it('shares a pending acquire between callers', async () => {
        const { transport, acquire } = createFakeTransport();
        const device = createDevice(transport);

        const firstAcquire = device.acquire();
        const secondAcquire = device.acquire();
        await Promise.all([firstAcquire, secondAcquire]);

        expect(secondAcquire).toBe(firstAcquire);
        expect(acquire).toHaveBeenCalledTimes(1);
    });

    it('acquires only after a pending release settles', async () => {
        const { transport, acquire, resolveRelease } = createFakeTransport();
        const device = createDevice(transport);
        await device.acquire();
        const release = device.release();

        const reacquire = device.acquire();
        await flush();
        expect(acquire).toHaveBeenCalledTimes(1);

        resolveRelease();
        await release;
        await reacquire;

        expect(acquire).toHaveBeenCalledTimes(2);
        expect(device.isUsedHere()).toBe(true);
    });

    it('does not acquire for a run that was aborted while waiting for a release', async () => {
        const { transport, acquire, resolveRelease } = createFakeTransport();
        const device = createDevice(transport);
        await device.acquire();
        device.release();

        const run = device.run(() => Promise.resolve());
        const runResult = run.catch(error => error);
        const interrupt = device.interrupt(ERRORS.TypedError('Method_Cancel'));

        resolveRelease();
        await interrupt;
        await flush();

        expect(await runResult).toMatchObject({ code: 'Method_Cancel' });
        expect(acquire).toHaveBeenCalledTimes(1);
        expect(device.isUsedHere()).toBe(false);
    });

    it('hands over the previous session on re-acquire', async () => {
        const { transport } = createFakeTransport();
        const device = createDevice(transport);
        await device.acquire();

        const reacquire = device.acquire();
        // The transport asks the holder of the previous session, i.e. this device, to release it.
        (transport.deviceEvents as unknown as EventEmitter).emit(PATH, {
            type: TRANSPORT.DEVICE_REQUEST_RELEASE,
        });
        await reacquire;

        expect(transport.releaseDevice).toHaveBeenCalledWith('1');
        expect(device.isUsedHere()).toBe(true);
    });

    it('stays released when disconnected during acquire', async () => {
        const { transport } = createFakeTransport();
        const device = createDevice(transport);

        const acquire = device.acquire();
        (transport.deviceEvents as unknown as EventEmitter).emit(PATH, {
            type: TRANSPORT.DEVICE_DISCONNECTED,
        });

        await expect(acquire).rejects.toMatchObject({ code: 'Device_Disconnected' });
        expect(device.isUsedHere()).toBe(false);
    });
});
