import { isDriversEnabled } from './gate';
import { PERF_HOOK_GLOBAL_KEY, type SuiteDriversPerfHook } from './perfHook';

const REACT_HOOK_KEY = '__REACT_DEVTOOLS_GLOBAL_HOOK__';
const COMMIT_TIMES_CAP = 100_000;

/**
 * The subset of the React DevTools hook react-dom talks to (`injectInternals`): `inject` once per
 * renderer, `onCommitFiberRoot` once per commit, the rest stubs for the DevTools frontend. React has
 * no public API a production bundle reports commits through: `<Profiler>` and the performance
 * tracks of React 19.2 are compiled out of production react-dom, so this hook protocol, which React
 * DevTools, react-refresh and `@trezor/perf-e2e` use as well, is the one channel.
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

/** What a hook another owner installed first has to offer to be wrapped: the callbacks react-dom calls. */
type ForeignReactHook = {
    renderers?: unknown;
    inject: (...args: unknown[]) => unknown;
    onCommitFiberRoot: (...args: unknown[]) => unknown;
};

type HookWindow = Window & {
    [REACT_HOOK_KEY]?: unknown;
    [PERF_HOOK_GLOBAL_KEY]?: SuiteDriversPerfHook;
};

const isForeignReactHook = (value: unknown): value is ForeignReactHook => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const hook = value as Partial<ForeignReactHook>;

    return typeof hook.inject === 'function' && typeof hook.onCommitFiberRoot === 'function';
};

const createPerfHook = (wrapped: boolean): SuiteDriversPerfHook => {
    const perf: SuiteDriversPerfHook = {
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

const countCommit = (perf: SuiteDriversPerfHook) => {
    perf.commits += 1;
    if (perf.commitTimes.length < COMMIT_TIMES_CAP) {
        perf.commitTimes.push(performance.now());
    }
};

const createReactHook = (perf: SuiteDriversPerfHook): ReactDevToolsHook => {
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
 * Counts through a hook another owner installed first (the perf rig's init script on web, the React
 * DevTools extension, react-refresh in development builds). react-dom reads both callbacks off the
 * hook object at call time, and the owner's callbacks keep running, so DevTools and refresh work as
 * before; react-refresh patches a hook the same way.
 */
const wrapReactHook = (hook: ForeignReactHook, perf: SuiteDriversPerfHook) => {
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

const observeLongTasks = (perf: SuiteDriversPerfHook) => {
    try {
        const observer = new PerformanceObserver(list => {
            perf.longTasks = (perf.longTasks ?? 0) + list.getEntries().length;
        });
        observer.observe({ type: 'longtask', buffered: true });
        perf.longTasks = 0;
    } catch {
        // Not every engine reports `longtask` entries; null says so instead of a misleading zero.
    }
};

/**
 * Installs the perf counters before react-dom evaluates, so React commit counts exist in every gated
 * session; desktop has no init script that could win that race. With no React DevTools hook yet it
 * installs a minimal one; with a hook already there it wraps that hook's callbacks instead of
 * replacing or yielding to it, so the counts exist under the React DevTools extension and in
 * development builds too. Does nothing while the gate is off, answers the counters it installed
 * before when called again, and leaves an object it cannot wrap alone.
 */
export const installEarlyPerfHook = (): SuiteDriversPerfHook | undefined => {
    if (typeof window === 'undefined' || !isDriversEnabled()) {
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
