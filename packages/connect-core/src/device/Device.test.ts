import { ERRORS, asDeviceUniquePath } from '@trezor/connect-common';
import { noopCreateLogger } from '@trezor/logger';
import {
    AbstractTransport,
    DEVICE_TYPE,
    type Descriptor,
    PathPublic,
    Session,
    TRANSPORT_ERROR,
    type Transport,
    success,
} from '@trezor/transport-common';
import { type Deferred, createDeferred } from '@trezor/utils';

import { Device } from './Device';

// The handshake talks to the device, these tests only cover the session handling.
jest.mock('./workflow/handshake', () => ({ handshakeCancel: jest.fn() }));

const PATH = PathPublic('1');
const RUN_OPTIONS = { skipFirmwareChecks: true, skipFinalReload: true };

const createDescriptor = (session: Session | null): Descriptor => ({
    path: PATH,
    session,
    type: DEVICE_TYPE.TypeT2,
    apiType: 'usb',
});

type AcquireResult = Awaited<ReturnType<Transport['acquire']>>;
type ReleaseResult = Awaited<ReturnType<Transport['release']>>;

// Holds every acquire and release until the test completes it.
class ControllableTransport extends AbstractTransport {
    public readonly name = 'NodeUsbTransport';
    public readonly pendingAcquires: Deferred<AcquireResult>[] = [];
    public readonly pendingReleases: Deferred<ReleaseResult>[] = [];

    constructor() {
        super({ id: 'test' });
        this.stopped = false;
        this.setSession(null);
    }

    init() {
        return Promise.resolve(success(undefined));
    }

    listen() {
        return success(undefined);
    }

    enumerate() {
        return Promise.resolve(success(this.descriptors));
    }

    acquire() {
        const dfd = createDeferred<AcquireResult>();
        this.pendingAcquires.push(dfd);

        return dfd.promise;
    }

    release() {
        const dfd = createDeferred<ReleaseResult>();
        this.pendingReleases.push(dfd);

        return dfd.promise;
    }

    releaseDevice() {
        return Promise.resolve(success(undefined));
    }

    releaseSync() {}

    send() {
        return Promise.reject(new Error('Not supported.'));
    }

    receive() {
        return Promise.reject(new Error('Not supported.'));
    }

    call() {
        return Promise.reject(new Error('Not supported.'));
    }

    setSession(session: Session | null) {
        this.handleDescriptorsChange([createDescriptor(session)]);
    }

    completeAcquire(session: Session) {
        this.pendingAcquires.shift()?.resolve(success(session));
        this.setSession(session);
    }

    completeRelease() {
        this.pendingReleases.shift()?.resolve(success(null));
        this.setSession(null);
    }

    disconnect() {
        this.handleDescriptorsChange([]);
    }
}

const createDevice = () => {
    const transport = new ControllableTransport();
    const device = new Device({
        id: asDeviceUniquePath('1'),
        transport,
        descriptor: createDescriptor(null),
        createLogger: noopCreateLogger,
    });
    jest.spyOn(device, 'initialize').mockResolvedValue(undefined);

    return { transport, device };
};

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('Device', () => {
    it('does not leave an unhandled rejection when another client takes the device during acquire', async () => {
        const { transport, device } = createDevice();

        const run = device.run(() => Promise.resolve(), RUN_OPTIONS);
        await flush();
        transport.setSession(Session('2'));
        transport.completeAcquire(Session('1'));

        // Jest fails the test on any unhandled rejection from the session change handler.
        await expect(run).rejects.toThrow(TRANSPORT_ERROR.SESSION_WRONG_PREVIOUS);
        await flush();
    });

    it('does not acquire for a run interrupted while waiting for the previous release', async () => {
        const { transport, device } = createDevice();

        const firstRun = device.run(() => Promise.resolve(), RUN_OPTIONS).catch(() => {});
        await flush();
        transport.completeAcquire(Session('1'));
        await flush();
        expect(transport.pendingReleases).toHaveLength(1);
        await device.interrupt(new Error('first'));
        await firstRun;

        const secondRun = device.run(() => Promise.resolve(), RUN_OPTIONS).catch(() => {});
        await flush();
        await device.interrupt(new Error('second'));
        await secondRun;

        transport.completeRelease();
        await flush();
        expect(transport.pendingAcquires).toHaveLength(0);
    });

    it('refuses to run or handshake once disconnected', async () => {
        const { transport, device } = createDevice();

        transport.disconnect();
        // The same path is live again, e.g. after a transport restart, and another client holds it.
        transport.setSession(Session('2'));

        expect(() => device.run()).toThrow(ERRORS.TypedError('Device_Disconnected'));
        await expect(device.handshake()).resolves.toBe(false);
    });
});
