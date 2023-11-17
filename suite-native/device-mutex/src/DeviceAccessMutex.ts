/**
 * Orchestrates concurrent exclusive access to the connected device.
 */
class DeviceAccessMutex {
    isLocked: boolean;
    taskQueue: ((value: unknown) => void)[];
    constructor() {
        this.isLocked = false;
        this.taskQueue = [];
    }

    prioritizedLock() {
        if (this.isLocked) {
            return new Promise(resolve => {
                // Put prioritized task at the beginning of the queue.
                this.taskQueue.splice(1, 0, resolve);
            });
        }
        this.isLocked = true;

        return Promise.resolve();
    }

    lock() {
        if (this.isLocked) {
            return new Promise(resolve => {
                // Put the task at the end of the queue.
                this.taskQueue.push(resolve);
            });
        }
        this.isLocked = true;

        return Promise.resolve();
    }

    unlock() {
        const resolve = this.taskQueue.shift();
        if (resolve) {
            // If there is a task in queue, execute it.
            resolve?.(null);
        } else {
            // Otherwise unlock the mutex.
            this.isLocked = false;
        }
    }
}

export const deviceAccessMutex = new DeviceAccessMutex();
