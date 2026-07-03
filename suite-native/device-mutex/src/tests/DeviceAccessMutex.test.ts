import { A } from '@mobily/ts-belt';

import { deviceAccessMutex } from '../DeviceAccessMutex';
import { DEVICE_ACCESS_ERROR } from '../constants';
import {
    clearAndUnlockDeviceAccessQueue,
    requestDeviceAccess,
    requestPrioritizedDeviceAccess,
} from '../requestDeviceAccess';

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
            requestDeviceAccess(deviceAccessCallbackMock),
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

    test('mutex unlocked on deviceCallback error', async () => {
        const callbackError = 'Callback failed';
        const mockCallback = jest.fn().mockRejectedValue(callbackError);

        const result = await requestDeviceAccess(mockCallback, false);

        expect(result).toEqual({ success: false, error: callbackError });
        expect(deviceAccessMutex.isLocked).toBe(false);
    });
});

describe('RequestPrioritizedDeviceAccess', () => {
    test('prioritized task execution', async () => {
        // Put multiple tasks in the queue.
        A.makeWithIndex(5, () => requestDeviceAccess(deviceAccessCallbackMock));

        expect(deviceAccessMutex.isLocked).toBe(true);

        // Execute prioritized task.
        await requestPrioritizedDeviceAccess(deviceAccessCallbackMock);

        // The prioritized task was put at the beginning of the queue (position 0), so it ran
        // right after task 0 finished, skipping all previously queued tasks.
        // After the prioritized task finishes: task 1 has been dequeued and is running,
        // tasks 2, 3, 4 remain in the queue.
        expect(deviceAccessMutex.isLocked).toBe(true);
        expect(deviceAccessMutex.taskQueue.length).toBe(3);
    });
});

describe('clearAndUnlockDeviceAccessQueue', () => {
    test('cleared tasks should not be executed', async () => {
        const numberOfTasks = 5;

        // Put multiple tasks in the queue.
        const queuedTasks = A.makeWithIndex(numberOfTasks, () =>
            requestDeviceAccess(deviceAccessCallbackMock),
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

    test('prioritized task is cancelled by clearing the queue', async () => {
        // Reset shared singleton state possibly left over from previous tests.
        clearAndUnlockDeviceAccessQueue();

        // Hold the lock so the prioritized request has to wait in the queue. Locking
        // synchronously (no timer callback) keeps the setup free of leaked timers and
        // lets us reach the clearing call without an await where a stray task could run.
        void deviceAccessMutex.lock();
        const prioritizedTask = requestPrioritizedDeviceAccess(deviceAccessCallbackMock);

        expect(deviceAccessMutex.isLocked).toBe(true);
        expect(deviceAccessMutex.taskQueue.length).toBe(1);

        clearAndUnlockDeviceAccessQueue();

        // The prioritized waiter must be rejected like any other queued task instead of
        // resolving `true` and running its device callback after the queue was cleared.
        expect(await prioritizedTask).toBe(DEVICE_ACCESS_ERROR);
        expect(deviceAccessMutex.isLocked).toBe(false);
        expect(deviceAccessMutex.taskQueue.length).toBe(0);
    });
});
