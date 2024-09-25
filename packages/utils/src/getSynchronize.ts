import { getMutex } from './getMutex';

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
export const getSynchronize = (mutex?: ReturnType<typeof getMutex>) => {
    const lock = mutex ?? getMutex();

    return <T>(action: () => T, lockId?: keyof any): T extends Promise<unknown> ? T : Promise<T> =>
        lock(lockId).then(unlock => Promise.resolve().then(action).finally(unlock)) as any;
};

export type Synchronize = ReturnType<typeof getSynchronize>;
