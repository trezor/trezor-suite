/**
 * Ensures that since the awaited lock is obtained until unlock return from it
 * is called, no other part of code can enter the same lock.
 *
 * Optionally, it also takes `lockId` param, in which case only actions with
 * the same lock id are blocking each other.
 *
 * Example:
 *
 * ```
 * const lock = getMutex();
 *
 * lock().then(unlock => writeToSocket('foo').finally(unlock));
 * lock().then(unlock => writeToSocket('bar').finally(unlock));
 * lock('differentLockId').then(unlock => writeToAnotherSocket('baz').finally(unlock));
 *
 * const unlock = await lock();
 * await readFromSocket();
 * unlock();
 * ```
 */
export const getMutex = () => {
    const DEFAULT_ID = Symbol();
    const locks: Record<keyof any, Promise<void>> = {};

    return async (lockId: keyof any = DEFAULT_ID) => {
        while (locks[lockId]) {
            await locks[lockId];
        }
        let resolve = () => {};
        locks[lockId] = new Promise<void>(res => {
            resolve = res;
        }).finally(() => {
            delete locks[lockId];
        });

        return resolve;
    };
};
