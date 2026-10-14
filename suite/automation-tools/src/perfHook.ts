export const PERF_HOOK_GLOBAL_KEY = '__suiteAutomationPerf';

export type SuiteAutomationPerfHook = {
    /** React renderers that registered with the hook. */
    renderers: number;
    /** Commits since the hook was installed or last reset. */
    commits: number;
    /** `performance.now()` per commit, capped; `commits` keeps counting past the cap. */
    commitTimes: number[];
    /** Long tasks observed since install or reset; null when the engine has no `longtask` entries. */
    longTasks: number | null;
    reset: () => void;
};

type PerfHookWindow = Window & { [PERF_HOOK_GLOBAL_KEY]?: SuiteAutomationPerfHook };

export const readPerfHook = (): SuiteAutomationPerfHook | undefined =>
    typeof window === 'undefined' ? undefined : (window as PerfHookWindow)[PERF_HOOK_GLOBAL_KEY];
