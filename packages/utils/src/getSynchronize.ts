/**
 * Ensures that all async actions passed to the returned function are called
 * immediately one after another, without interfering with each other.
 * Optionally, it also takes `lockId` param, in which case only actions with
 * the same lock id are blocking each other.
 *
 * Example:
 *
 * ```
 * const synchronize = getSynchronize();
 * synchronize(() => asyncAction1());
 * synchronize(() => asyncAction2());
 * synchronize(() => asyncAction3(), 'differentLockId');
 * ```
 */
export const getSynchronize = () => {
    const DEFAULT_ID = Symbol();
    const locks: Record<keyof any, Promise<unknown>> = {};

    return <T>(
        action: () => T,
        lockId: keyof any = DEFAULT_ID,
    ): T extends Promise<unknown> ? T : Promise<T> => {
        const newLock = (locks[lockId] ?? Promise.resolve())
            .catch(() => {})
            .then(action)
            .finally(() => {
                if (locks[lockId] === newLock) {
                    delete locks[lockId];
                }
            });
        locks[lockId] = newLock;

        return newLock as any;
    };
};

export type Synchronize = ReturnType<typeof getSynchronize>;
