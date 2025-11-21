/**
 * Non-blocking implementation of the lock. If two task are trying to run at the same time,
 * only one is allowed to pass.
 *
 * In contrast with `getMutex.ts`, where all tasks are expected to wait and run once lock is released.
 */
export const createTryLock = () => {
    let acquired = false;

    const acquire = (): boolean => {
        if (acquired) {
            return false;
        }

        acquired = true;

        return true;
    };

    const release = (): void => {
        acquired = false;
    };

    return <T>(task: () => Promise<T>): Promise<T | null> => {
        if (acquire()) {
            return task().finally(release);
        }

        return Promise.resolve(null);
    };
};
