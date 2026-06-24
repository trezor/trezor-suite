// Key defaults to string, but a branded key (e.g. AccountKey) can be enforced via the type param.
export type KeyedThrottle<TKey extends string = string> = {
    /** Has `interval` ms elapsed since this id last ran (or it never did)? */
    canRun: (id: TKey) => boolean;
    /** Record a run for this id now (starts a new interval). */
    markRun: (id: TKey) => void;
    /** Drop the id so the next canRun() returns true again (forced run / cleanup). */
    reset: (id: TKey) => void;
    /** Drop all ids so the next canRun() returns true for everything. */
    resetAll: () => void;
};

/**
 * Leading-edge throttle keyed by id. Answers "has `interval` ms elapsed since this id last ran?"
 * without storing the timestamp on the caller's entity (which, in Redux, would churn its reference
 * and re-render everything that reads it).
 *
 * Intentionally lazy - elapsed time is computed on read, so there is no background interval to run
 * or clean up. A forgotten entry is just a number; `reset` removes it.
 */
export const createKeyedThrottle = <TKey extends string = string>(
    interval: number,
): KeyedThrottle<TKey> => {
    const lastRunByKey = new Map<TKey, number>();

    const canRun = (id: TKey) => Date.now() - (lastRunByKey.get(id) ?? 0) >= interval;
    const markRun = (id: TKey) => {
        lastRunByKey.set(id, Date.now());
    };
    const reset = (id: TKey) => {
        lastRunByKey.delete(id);
    };
    const resetAll = () => {
        lastRunByKey.clear();
    };

    return { canRun, markRun, reset, resetAll };
};
