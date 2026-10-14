export const PERF_HOOK_GLOBAL_KEY = '__suiteAutomationPerf';

export type SuiteAutomationPerfHook = {
    /**
     * True when the counts go through a hook someone else installed first.
     */
    wrapped: boolean;
    /**
     * Registered React renderers.
     */
    renderers: number;
    /**
     * Commits since install or the last reset.
     */
    commits: number;
    /**
     * `performance.now()` per commit, capped; `commits` keeps counting past the cap.
     */
    commitTimes: number[];
    /**
     * Long tasks since install or the last reset; null without `longtask` support.
     */
    longTasks: number | null;
    reset: () => void;
};

type PerfHookWindow = Window & { [PERF_HOOK_GLOBAL_KEY]?: SuiteAutomationPerfHook };

export const readPerfHook = (): SuiteAutomationPerfHook | undefined =>
    typeof window === 'undefined' ? undefined : (window as PerfHookWindow)[PERF_HOOK_GLOBAL_KEY];
