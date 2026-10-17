export const PERF_HOOK_GLOBAL_KEY = '__suiteDriversPerf';

export type SuiteDriversPerfHook = {
    /** Whether the counts pass through a hook another owner installed first (React DevTools, react-refresh, the perf rig). */
    wrapped: boolean;
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

type PerfHookWindow = Window & { [PERF_HOOK_GLOBAL_KEY]?: SuiteDriversPerfHook };

export const readPerfHook = (): SuiteDriversPerfHook | undefined =>
    typeof window === 'undefined' ? undefined : (window as PerfHookWindow)[PERF_HOOK_GLOBAL_KEY];
