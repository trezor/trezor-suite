// Key defaults to string, but a branded key (e.g. AccountKey) can be enforced via the type param.
export type KeyedThrottle<TKey extends string = string> = {
    /** Has `interval` ms elapsed since this id last ran (per `getLastRun`), or it never did? */
    canRun: (id: TKey) => boolean;
};

/**
 * Leading-edge throttle keyed by id. Answers "has `interval` ms elapsed since this id last ran?".
 *
 * It does not store the timestamps itself - `getLastRun` reads them from wherever they live (e.g. a
 * store slice), so the source of truth stays in one place and this stays a pure, testable predicate.
 */
export const createKeyedThrottle = <TKey extends string = string>(
    interval: number,
    getLastRun: (id: TKey) => number | undefined,
): KeyedThrottle<TKey> => ({
    canRun: (id: TKey) => Date.now() - (getLastRun(id) ?? 0) >= interval,
});
