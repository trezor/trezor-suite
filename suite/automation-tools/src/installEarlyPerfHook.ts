import { isAutomationToolsEnabled } from './gate';
import { PERF_HOOK_GLOBAL_KEY, type SuiteAutomationPerfHook } from './perfHook';

const REACT_HOOK_KEY = '__REACT_DEVTOOLS_GLOBAL_HOOK__';
const COMMIT_TIMES_CAP = 100_000;

/**
 * The part of the React DevTools hook react-dom calls.
 * Production React reports commits through nothing else:
 * `<Profiler>` and the performance tracks are compiled out.
 */
type ReactDevToolsHook = {
    renderers: Map<number, unknown>;
    supportsFiber: true;
    inject: (renderer: unknown) => number;
    onCommitFiberRoot: () => void;
    onPostCommitFiberRoot: () => void;
    onCommitFiberUnmount: () => void;
    onScheduleFiberRoot: () => void;
    setStrictMode: () => void;
    registerInternalModuleStart: () => void;
    registerInternalModuleStop: () => void;
};

/**
 * What an existing hook needs to be wrapped: the callbacks react-dom calls.
 */
type ForeignReactHook = {
    renderers?: unknown;
    inject: (...args: unknown[]) => unknown;
    onCommitFiberRoot: (...args: unknown[]) => unknown;
};

type HookWindow = Window & {
    [REACT_HOOK_KEY]?: unknown;
    [PERF_HOOK_GLOBAL_KEY]?: SuiteAutomationPerfHook;
};

const isForeignReactHook = (value: unknown): value is ForeignReactHook => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const hook = value as Partial<ForeignReactHook>;

    return typeof hook.inject === 'function' && typeof hook.onCommitFiberRoot === 'function';
};

const createPerfHook = (wrapped: boolean): SuiteAutomationPerfHook => {
    const perf: SuiteAutomationPerfHook = {
        wrapped,
        renderers: 0,
        commits: 0,
        commitTimes: [],
        longTasks: null,
        reset: () => {
            perf.commits = 0;
            perf.commitTimes = [];
            if (perf.longTasks !== null) {
                perf.longTasks = 0;
            }
        },
    };

    return perf;
};

const countCommit = (perf: SuiteAutomationPerfHook) => {
    perf.commits += 1;
    if (perf.commitTimes.length < COMMIT_TIMES_CAP) {
        perf.commitTimes.push(performance.now());
    }
};

const createReactHook = (perf: SuiteAutomationPerfHook): ReactDevToolsHook => {
    const renderers = new Map<number, unknown>();

    return {
        renderers,
        supportsFiber: true,
        inject: renderer => {
            const id = renderers.size + 1;
            renderers.set(id, renderer);
            perf.renderers = renderers.size;

            return id;
        },
        onCommitFiberRoot: () => countCommit(perf),
        onPostCommitFiberRoot: () => {},
        onCommitFiberUnmount: () => {},
        onScheduleFiberRoot: () => {},
        setStrictMode: () => {},
        registerInternalModuleStart: () => {},
        registerInternalModuleStop: () => {},
    };
};

/**
 * Counts through a hook someone else installed first (React DevTools, react-refresh, a harness).
 * Their callbacks still run.
 */
const wrapReactHook = (hook: ForeignReactHook, perf: SuiteAutomationPerfHook) => {
    const { inject, onCommitFiberRoot } = hook;
    perf.renderers = hook.renderers instanceof Map ? hook.renderers.size : 0;
    hook.inject = (...args) => {
        const id = inject.apply(hook, args);
        perf.renderers += 1;

        return id;
    };
    hook.onCommitFiberRoot = (...args) => {
        countCommit(perf);

        return onCommitFiberRoot.apply(hook, args);
    };
};

const observeLongTasks = (perf: SuiteAutomationPerfHook) => {
    try {
        const observer = new PerformanceObserver(list => {
            perf.longTasks = (perf.longTasks ?? 0) + list.getEntries().length;
        });
        observer.observe({ type: 'longtask', buffered: true });
        perf.longTasks = 0;
    } catch {
        // No `longtask` support: keep null instead of a misleading zero.
    }
};

/**
 * Sets up commit counting before react-dom evaluates, which no init script can do on desktop:
 * installs a minimal React DevTools hook, or wraps the one already there.
 * Does nothing with the gate off or with a hook it cannot wrap.
 * A second call returns the first call's counters.
 */
export const installEarlyPerfHook = (): SuiteAutomationPerfHook | undefined => {
    if (typeof window === 'undefined' || !isAutomationToolsEnabled()) {
        return undefined;
    }

    const hookWindow = window as HookWindow;
    const installed = hookWindow[PERF_HOOK_GLOBAL_KEY];
    if (installed !== undefined) {
        return installed;
    }

    const existing = hookWindow[REACT_HOOK_KEY];
    const perf = createPerfHook(existing !== undefined);
    if (existing === undefined) {
        hookWindow[REACT_HOOK_KEY] = createReactHook(perf);
    } else if (isForeignReactHook(existing)) {
        wrapReactHook(existing, perf);
    } else {
        return undefined;
    }

    observeLongTasks(perf);
    hookWindow[PERF_HOOK_GLOBAL_KEY] = perf;

    return perf;
};
