/**
 * Lifecycle steps as User Timing marks, readable without the store:
 * by the automation tools, by traces and by Sentry (as boot spans, with analytics consent).
 * The names carry no data.
 */
export const SuiteLifecycleMark = {
    /**
     * `initThunk` started: consent resolved, store hydrated.
     */
    Init: 'suite:init',
    /**
     * `initThunk` finished: connect and the backends are up.
     */
    Ready: 'suite:ready',
    /**
     * The loading screen is gone and the app is shown.
     */
    Interactive: 'suite:interactive',
} as const;

export type SuiteLifecycleMark = (typeof SuiteLifecycleMark)[keyof typeof SuiteLifecycleMark];

/**
 * First time each step was marked (`performance.now()` ms); null before it happened.
 */
export type SuiteLifecycleMarkTimes = Record<SuiteLifecycleMark, number | null>;

// jsdom has `performance` but no User Timing, so check the methods.
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
