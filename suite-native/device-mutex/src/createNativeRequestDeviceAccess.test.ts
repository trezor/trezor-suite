import { deviceAccessMutex } from './DeviceAccessMutex';
import { createNativeRequestDeviceAccess } from './createNativeRequestDeviceAccess';
import { clearAndUnlockDeviceAccessQueue, requestDeviceAccess } from './requestDeviceAccess';

const pendingDeviceCall = () => new Promise(resolve => setTimeout(() => resolve(true), 50));

describe('createNativeRequestDeviceAccess', () => {
    afterEach(() => {
        clearAndUnlockDeviceAccessQueue();
    });

    it('runs the callback and returns its result', async () => {
        const result = await createNativeRequestDeviceAccess()(() => Promise.resolve('features'));

        expect(result).toEqual({ success: true, payload: 'features' });
    });

    // The mutex passes the thrown value through as-is, so the service is what makes the error a
    // string, as the shared type promises.
    it('reports a throwing callback as a failure that was not skipped', async () => {
        const result = await createNativeRequestDeviceAccess()(() =>
            Promise.reject(new Error('Device call failed')),
        );

        expect(result).toEqual({
            success: false,
            error: 'Device call failed',
            wasSkipped: false,
        });
    });

    it('waits for its turn instead of running straight away', async () => {
        const runningCall = requestDeviceAccess(pendingDeviceCall);
        const deviceCallback = jest.fn();

        const queuedCall = createNativeRequestDeviceAccess()(deviceCallback);
        expect(deviceCallback).not.toHaveBeenCalled();

        await runningCall;
        await queuedCall;
        expect(deviceCallback).toHaveBeenCalled();
    });

    it('skips a skipIfBusy request while another task is already waiting', async () => {
        requestDeviceAccess(pendingDeviceCall);
        requestDeviceAccess(pendingDeviceCall);
        expect(deviceAccessMutex.taskQueue.length).toBe(1);

        const deviceCallback = jest.fn();
        const result = await createNativeRequestDeviceAccess()(deviceCallback, {
            priority: 'skipIfBusy',
        });

        expect(deviceCallback).not.toHaveBeenCalled();
        expect(result.success).toBe(false);
        expect(result).toHaveProperty('wasSkipped', true);
    });

    it('queues a skipIfBusy request when only the running task holds the device', async () => {
        const runningCall = requestDeviceAccess(pendingDeviceCall);
        const deviceCallback = jest.fn();

        const queuedCall = createNativeRequestDeviceAccess()(deviceCallback, {
            priority: 'skipIfBusy',
        });

        await runningCall;
        await queuedCall;
        expect(deviceCallback).toHaveBeenCalled();
    });

    // NOTE: `prioritizedLock` splices the task in at index 1 rather than 0, so it overtakes every
    // waiting task but the first one.
    it('puts a prioritized request ahead of the queue', async () => {
        const callOrder: string[] = [];
        const trackedCall = (name: string) => () => {
            callOrder.push(name);

            return pendingDeviceCall();
        };

        const runningCall = requestDeviceAccess(trackedCall('running'));
        const queuedCalls = ['queuedFirst', 'queuedSecond'].map(name =>
            requestDeviceAccess(trackedCall(name)),
        );
        const prioritizedCall = createNativeRequestDeviceAccess()(trackedCall('prioritized'), {
            priority: 'prioritized',
        });

        await Promise.all([runningCall, ...queuedCalls, prioritizedCall]);

        expect(callOrder).toEqual(['running', 'queuedFirst', 'prioritized', 'queuedSecond']);
    });
});
