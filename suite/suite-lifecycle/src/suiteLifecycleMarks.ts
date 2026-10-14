/**
 * Lifecycle steps marked on the User Timing timeline (`performance.mark`), readable without the
 * store: by the automation tools' `suite.ready`, by CDP and DevTools traces and, for sessions with
 * analytics consent, by Sentry's tracing as boot spans. The names are constant and carry no data.
 */
export const SuiteLifecycleMark = {
    /** `initThunk` started: the analytics consent is resolved and the store is hydrated. */
    Init: 'suite:init',
    /** `initThunk` finished: connect and the backends are up, `onSuiteReady` is dispatched. */
    Ready: 'suite:ready',
    /** The loading screen made way for the app: ready, router loaded, the initial transport wait over. */
    Interactive: 'suite:interactive',
} as const;

export type SuiteLifecycleMark = (typeof SuiteLifecycleMark)[keyof typeof SuiteLifecycleMark];

/** When each step was first marked, in `performance.now()` milliseconds; null before it happened. */
export type SuiteLifecycleMarkTimes = Record<SuiteLifecycleMark, number | null>;

// jsdom has no User Timing at all, so the guards are on the methods, not on `performance`.
export const markSuiteLifecycle = (mark: SuiteLifecycleMark): void => {
    if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
        return;
    }
    performance.mark(mark);
};

export const getSuiteLifecycleMarkTime = (mark: SuiteLifecycleMark): number | null => {
    if (typeof performance === 'undefined' || typeof performance.getEntriesByName !== 'function') {
        return null;
    }

    return performance.getEntriesByName(mark, 'mark').at(0)?.startTime ?? null;
};

export const getSuiteLifecycleMarkTimes = (): SuiteLifecycleMarkTimes => ({
    [SuiteLifecycleMark.Init]: getSuiteLifecycleMarkTime(SuiteLifecycleMark.Init),
    [SuiteLifecycleMark.Ready]: getSuiteLifecycleMarkTime(SuiteLifecycleMark.Ready),
    [SuiteLifecycleMark.Interactive]: getSuiteLifecycleMarkTime(SuiteLifecycleMark.Interactive),
});
