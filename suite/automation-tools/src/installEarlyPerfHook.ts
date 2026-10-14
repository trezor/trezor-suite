import { isAutomationToolsEnabled } from './gate';
import { PERF_HOOK_GLOBAL_KEY, type SuiteAutomationPerfHook } from './perfHook';

const REACT_HOOK_KEY = '__REACT_DEVTOOLS_GLOBAL_HOOK__';
const COMMIT_TIMES_CAP = 100_000;

// The subset of the React DevTools hook react-dom talks to; the rest of the real hook is for the
// DevTools frontend. `packages/perf-e2e` installs the same shape from a Playwright init script.
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

type HookWindow = Window & {
    [REACT_HOOK_KEY]?: unknown;
    [PERF_HOOK_GLOBAL_KEY]?: SuiteAutomationPerfHook;
};

/**
 * Installs a minimal React DevTools hook before react-dom evaluates, so React commit counts exist
 * in every gated session; desktop has no init script that could win that race. Does nothing when
 * the gate is off or a hook is already there: its owner (the perf rig's init script, the React
 * DevTools extension) is then authoritative and `suite.perf` answers `installed: false`.
 */
export const installEarlyPerfHook = (): SuiteAutomationPerfHook | undefined => {
    if (typeof window === 'undefined' || !isAutomationToolsEnabled()) {
        return undefined;
    }

    const hookWindow = window as HookWindow;
    if (hookWindow[REACT_HOOK_KEY] !== undefined) {
        return undefined;
    }

    const perf: SuiteAutomationPerfHook = {
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
    const renderers = new Map<number, unknown>();
    const reactHook: ReactDevToolsHook = {
        renderers,
        supportsFiber: true,
        inject: renderer => {
            const id = renderers.size + 1;
            renderers.set(id, renderer);
            perf.renderers = renderers.size;

            return id;
        },
        onCommitFiberRoot: () => {
            perf.commits += 1;
            if (perf.commitTimes.length < COMMIT_TIMES_CAP) {
                perf.commitTimes.push(performance.now());
            }
        },
        onPostCommitFiberRoot: () => {},
        onCommitFiberUnmount: () => {},
        onScheduleFiberRoot: () => {},
        setStrictMode: () => {},
        registerInternalModuleStart: () => {},
        registerInternalModuleStop: () => {},
    };

    try {
        const observer = new PerformanceObserver(list => {
            perf.longTasks = (perf.longTasks ?? 0) + list.getEntries().length;
        });
        observer.observe({ type: 'longtask', buffered: true });
        perf.longTasks = 0;
    } catch {
        // Not every engine reports `longtask` entries; null says so instead of a misleading zero.
    }

    hookWindow[REACT_HOOK_KEY] = reactHook;
    hookWindow[PERF_HOOK_GLOBAL_KEY] = perf;

    return perf;
};
