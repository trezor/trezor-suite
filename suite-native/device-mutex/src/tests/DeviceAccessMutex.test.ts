import { A } from '@mobily/ts-belt';

import { deviceAccessMutex } from '../DeviceAccessMutex';
import {
    clearAndUnlockDeviceAccessQueue,
    requestDeviceAccess,
    requestPrioritizedDeviceAccess,
} from '../requestDeviceAccess';
import { DEVICE_ACCESS_ERROR } from '../constants';

const deviceAccessCallbackMock = () =>
    new Promise(resolve => {
        setTimeout(() => {
            resolve(true);
        }, 50);
    });

describe('DeviceAccessMutex', () => {
    test('Locking and unlocking the deviceAccessMutex', async () => {
        expect(deviceAccessMutex.isLocked).toBe(false);

        await deviceAccessMutex.lock();
        expect(deviceAccessMutex.isLocked).toBe(true);

        deviceAccessMutex.unlock();
        expect(deviceAccessMutex.isLocked).toBe(false);
    });

    test('locking deviceAccessMutex with tasks in the queue', async () => {
        // Lock the mutex with the task 1.
        await deviceAccessMutex.lock();

        // Ensure the mutex is locked and there is no other task waiting in the queue.
        expect(deviceAccessMutex.isLocked).toBe(true);
        expect(deviceAccessMutex.taskQueue.length).toBe(0);

        // Add task 2. to the queue.
        deviceAccessMutex.lock();

        // Ensure the mutex is still locked with task 2. in the queue.
        expect(deviceAccessMutex.isLocked).toBe(true);
        expect(deviceAccessMutex.taskQueue.length).toBe(1);

        // Finish the execution of the task 1.
        deviceAccessMutex.unlock();

        // The mutex should still be locked and the task 2. should be popped from the queue.
        expect(deviceAccessMutex.isLocked).toBe(true);
        expect(deviceAccessMutex.taskQueue.length).toBe(0);

        // Finish the task 2.
        deviceAccessMutex.unlock();

        // After finishing the 2. task, the mutex should be unlocked.
        expect(deviceAccessMutex.isLocked).toBe(false);
        expect(deviceAccessMutex.taskQueue.length).toBe(0);
    });
});

describe('RequestDeviceAccess', () => {
    test('requesting by multiple tasks in parallel', async () => {
        const numberOfTasks = 5;

        // Put multiple tasks in the queue.
        const queuedTasks = A.makeWithIndex(numberOfTasks, () =>
            requestDeviceAccess({
                deviceCallback: deviceAccessCallbackMock,
            }),
        );

        let expectedQueueLength = 4;
        expect(deviceAccessMutex.isLocked).toBe(true);
        expect(deviceAccessMutex.taskQueue.length).toBe(expectedQueueLength);

        for (const index in queuedTasks) {
            expect(deviceAccessMutex.isLocked).toBe(true);

            // Execute each of the tasks.
            await queuedTasks[index];

            expectedQueueLength = Math.max(0, expectedQueueLength - 1);
            expect(deviceAccessMutex.taskQueue.length).toBe(expectedQueueLength);
        }

        // Mutex should be unlocked after execution of all the queued tasks.
        expect(deviceAccessMutex.isLocked).toBe(false);
    });

    test('mutex unlocked on deviceCallback failure', async () => {
        const callbackError = 'Callback failed';
        const mockCallback = jest.fn().mockRejectedValue(callbackError);

        const result = await requestDeviceAccess({
            deviceCallback: mockCallback,
            isPrioritized: false,
            callbackParams: [],
        });

        expect(result).toEqual({ success: false, error: callbackError });
        expect(deviceAccessMutex.isLocked).toBe(false);
    });
});

describe('RequestPrioritizedDeviceAccess', () => {
    test('prioritized task execution', async () => {
        // Put multiple tasks in the queue.
        A.makeWithIndex(5, () =>
            requestDeviceAccess({
                deviceCallback: deviceAccessCallbackMock,
            }),
        );

        expect(deviceAccessMutex.isLocked).toBe(true);

        // Execute prioritized task.
        await requestPrioritizedDeviceAccess({
            deviceCallback: deviceAccessCallbackMock,
        });

        // The prioritized task should be put at the beginning of the queue, so after its execution,
        // so there should be still the rest of the tasks in the queue.
        expect(deviceAccessMutex.isLocked).toBe(true);
        expect(deviceAccessMutex.taskQueue.length).toBe(2);
    });
});

describe('clearAndUnlockDeviceAccessQueue', () => {
    test('cleared tasks should not be executed', async () => {
        const numberOfTasks = 5;

        // Put multiple tasks in the queue.
        const queuedTasks = A.makeWithIndex(numberOfTasks, () =>
            requestDeviceAccess({
                deviceCallback: deviceAccessCallbackMock,
            }),
        );
        expect(deviceAccessMutex.isLocked).toBe(true);

        clearAndUnlockDeviceAccessQueue();

        for (const index in queuedTasks) {
            const response = await queuedTasks[index];

            // All tasks should return access error, and stop the execution.
            expect(response).toBe(DEVICE_ACCESS_ERROR);
        }

        // Mutex should be unlocked and empty after clearing the queue.
        expect(deviceAccessMutex.isLocked).toBe(false);
        expect(deviceAccessMutex.taskQueue.length).toBe(0);
    });
});
