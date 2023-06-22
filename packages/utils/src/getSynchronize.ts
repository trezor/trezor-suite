/**
 * Ensures that all async actions passed to the returned function are called
 * immediately one after another, without interfering with each other.
 *
 * Example:
 *
 * ```
 * const synchronize = getSynchronize();
 * synchronize(() => asyncAction1());
 * synchronize(() => asyncAction2());
 * ```
 */
export const getSynchronize = () => {
    let lock: Promise<any> | undefined;

    return <T>(action: () => T | Promise<T>): Promise<T> => {
        const newLock = (lock ?? Promise.resolve())
            .catch(() => {})
            .then(action)
            .finally(() => {
                if (lock === newLock) {
                    lock = undefined;
                }
            });
        lock = newLock;
        return lock;
    };
};
