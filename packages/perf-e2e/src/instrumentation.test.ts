import {
    PERF_GLOBAL_KEY,
    endPerfInteraction,
    installPerfInstrumentation,
    readPerfMetrics,
    startPerfMeasurement,
    waitForPageIdle,
} from './instrumentation';

type LongTaskEntry = { startTime: number; duration: number };

/**
 * The instrumentation runs inside the page and reaches for browser globals only, so a test provides
 * them rather than a DOM: a window that is its own top frame, and an observer whose entries the test
 * delivers when it wants the engine to have seen them.
 */
const setupBrowserGlobals = ({ observesLongTasks = true } = {}) => {
    const window = { top: null as unknown, self: null as unknown } as Record<string, unknown>;
    window.top = window;
    window.self = window;
    (globalThis as any).window = window;

    let deliver: ((entries: LongTaskEntry[]) => void) | undefined;

    (globalThis as any).PerformanceObserver = class {
        constructor(callback: (list: { getEntries: () => LongTaskEntry[] }) => void) {
            deliver = entries => callback({ getEntries: () => entries });
        }

        observe() {
            if (!observesLongTasks) {
                // What an engine without long-task support does.
                throw new Error('longtask is not a supported entry type');
            }
        }
    };

    return {
        window,
        deliverLongTasks: (entries: LongTaskEntry[]) => deliver?.(entries),
    };
};

const reactHook = () =>
    (globalThis as any).window.__REACT_DEVTOOLS_GLOBAL_HOOK__ as {
        onCommitFiberRoot: (...args: unknown[]) => unknown;
        inject: (renderer: unknown) => number;
        supportsFiber: boolean;
    };

const commit = (times: number) => {
    for (let index = 0; index < times; index++) {
        reactHook().onCommitFiberRoot();
    }
};

describe(installPerfInstrumentation.name, () => {
    afterEach(() => {
        delete (globalThis as any).window;
        delete (globalThis as any).PerformanceObserver;
    });

    it('exposes the controller under the key the page is read through', () => {
        const { window } = setupBrowserGlobals();

        installPerfInstrumentation();

        expect(window[PERF_GLOBAL_KEY]).toBeDefined();
    });

    it('leaves a frame that is not the top one alone, so the Connect iframe is never touched', () => {
        const { window } = setupBrowserGlobals();
        window.top = { different: true };

        installPerfInstrumentation();

        expect(window[PERF_GLOBAL_KEY]).toBeUndefined();
    });

    it('installs once, so a second run cannot reset a measurement in progress', () => {
        const { window } = setupBrowserGlobals();

        installPerfInstrumentation();
        const controller = window[PERF_GLOBAL_KEY];
        installPerfInstrumentation();

        expect(window[PERF_GLOBAL_KEY]).toBe(controller);
    });

    it('counts the React commits made while the measurement is running', () => {
        setupBrowserGlobals();
        installPerfInstrumentation();

        commit(2); // before the window
        startPerfMeasurement();
        commit(3);
        const metrics = readPerfMetrics();
        commit(4); // after the window

        expect(metrics.reactCommitCount).toBe(3);
    });

    it('keeps counting commits between the end of the interaction and the read', () => {
        setupBrowserGlobals();
        installPerfInstrumentation();

        startPerfMeasurement();
        commit(1);
        endPerfInteraction();
        commit(2); // trailing renders, which the settle wait exists to catch

        expect(readPerfMetrics().reactCommitCount).toBe(3);
    });

    it('keeps a React DevTools hook that is already there working', () => {
        const { window } = setupBrowserGlobals();
        const existing = jest.fn();
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { onCommitFiberRoot: existing };

        installPerfInstrumentation();
        startPerfMeasurement();
        commit(1);

        expect(existing).toHaveBeenCalledTimes(1);
        expect(readPerfMetrics().reactCommitCount).toBe(1);
    });

    it('accepts the renderer React injects when no hook was there', () => {
        setupBrowserGlobals();
        installPerfInstrumentation();

        expect(reactHook().supportsFiber).toBe(true);
        expect(reactHook().inject({ renderer: true })).toBe(1);
    });
});

describe('long task metrics', () => {
    afterEach(() => {
        delete (globalThis as any).window;
        delete (globalThis as any).PerformanceObserver;
    });

    it('reports the blocking time and the longest task of the measured window', () => {
        const { deliverLongTasks } = setupBrowserGlobals();
        installPerfInstrumentation();

        startPerfMeasurement();
        deliverLongTasks([
            { startTime: performance.now(), duration: 80 },
            { startTime: performance.now(), duration: 120 },
        ]);
        const metrics = readPerfMetrics();

        // Only what each task spends over 50ms blocks.
        expect(metrics).toMatchObject({
            totalBlockingTimeMs: 100,
            longTaskCount: 2,
            longestTaskMs: 120,
        });
    });

    it('ignores a long task that started before the measurement did', () => {
        const { deliverLongTasks } = setupBrowserGlobals();
        installPerfInstrumentation();

        const beforeTheWindow = performance.now();
        startPerfMeasurement();
        // Delivery is asynchronous, so an entry from before the window can arrive inside it.
        deliverLongTasks([{ startTime: beforeTheWindow - 1, duration: 500 }]);

        expect(readPerfMetrics()).toMatchObject({
            totalBlockingTimeMs: 0,
            longTaskCount: 0,
            longestTaskMs: 0,
        });
    });

    it('reports null where long tasks cannot be observed, rather than a flattering zero', () => {
        setupBrowserGlobals({ observesLongTasks: false });
        installPerfInstrumentation();

        startPerfMeasurement();
        const metrics = readPerfMetrics();

        expect(metrics).toMatchObject({
            totalBlockingTimeMs: null,
            longTaskCount: null,
            longestTaskMs: null,
        });
        // What does not depend on the observer is still measured.
        expect(metrics.reactCommitCount).toBe(0);
        expect(metrics.interactionDurationMs).not.toBeNull();
    });
});

describe('measurement window', () => {
    afterEach(() => {
        delete (globalThis as any).window;
        delete (globalThis as any).PerformanceObserver;
    });

    it('stops the interaction clock where the interaction ended, not where the metrics are read', async () => {
        setupBrowserGlobals();
        installPerfInstrumentation();

        startPerfMeasurement();
        endPerfInteraction();
        const settled = new Promise(resolve => setTimeout(resolve, 50));
        await settled;

        expect(readPerfMetrics().interactionDurationMs).toBeLessThan(50);
    });

    it('refuses to measure before the instrumentation is installed', () => {
        setupBrowserGlobals();

        expect(() => startPerfMeasurement()).toThrow('not installed');
        expect(() => endPerfInteraction()).toThrow('not installed');
        expect(() => readPerfMetrics()).toThrow('not installed');
    });
});

describe(waitForPageIdle.name, () => {
    afterEach(() => {
        delete (globalThis as any).window;
        jest.useRealTimers();
    });

    it('waits only as long as the page needs, not for the whole timeout', async () => {
        const requestIdleCallback = jest.fn((callback: () => void) => setTimeout(callback, 5));
        (globalThis as any).window = { requestIdleCallback };

        const startedAt = performance.now();
        await waitForPageIdle(5_000);

        expect(performance.now() - startedAt).toBeLessThan(5_000);
        expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 5_000 });
    });

    it('falls back to waiting out the timeout where the page cannot report being idle', async () => {
        // Timers rather than the wall clock: `setTimeout` and `performance.now()` are not driven by
        // the same clock, so a real 20ms wait can measure as 19.5 and fail a test that is about
        // waiting for the timeout, not about how long a machine took to do it.
        jest.useFakeTimers();
        (globalThis as any).window = {};

        let settled = false;
        const idle = waitForPageIdle(20).then(() => {
            settled = true;
        });

        jest.advanceTimersByTime(19);
        await Promise.resolve();
        expect(settled).toBe(false);

        jest.advanceTimersByTime(1);
        await idle;

        expect(settled).toBe(true);
    });
});
