/**
 * Orchestrates concurrent exclusive access to the connected device.
 */
class DeviceAccessMutex {
    isLocked: boolean;
    taskQueue: ((value: boolean) => void)[];
    constructor() {
        this.isLocked = false;
        this.taskQueue = [];
    }

    prioritizedLock() {
        if (this.isLocked) {
            return new Promise(resolve => {
                // Put prioritized task at the beginning of the queue.
                this.taskQueue.splice(1, 0, () => resolve(true));
            });
        }
        this.isLocked = true;

        return Promise.resolve(true);
    }

    lock() {
        if (this.isLocked) {
            return new Promise<boolean>(resolve => {
                // Put the task at the end of the queue.
                this.taskQueue.push(resolve);
            });
        }
        this.isLocked = true;

        return Promise.resolve(true);
    }

    unlock() {
        const resolve = this.taskQueue.shift();
        if (resolve) {
            // If there is a task in queue, execute it.
            resolve?.(true);
        } else {
            // Otherwise unlock the mutex.
            this.isLocked = false;
        }
    }

    clearQueue() {
        // Resolve all tasks of the queue with `false` to indicate that task should not be executed.
        this.taskQueue.forEach(taskResolver => taskResolver(false));

        this.taskQueue = [];
        this.isLocked = false;
    }
}

export const deviceAccessMutex = new DeviceAccessMutex();
