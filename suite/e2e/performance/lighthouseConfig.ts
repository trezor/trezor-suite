/**
 * The switches that decide whether Lighthouse runs, kept apart from the flow itself so that the
 * Playwright config can read them without pulling Lighthouse — a heavy ESM dependency — into every
 * process that loads the config.
 */

const DEBUG_PORT_BASE = 9222;

export const LighthouseMode = {
    /** Lighthouse stays out of the way; tests run exactly as they do without it. */
    Off: 'off',
    /** One timespan per `perf.measure` block, i.e. around the interactions the suite already measures. */
    Steps: 'steps',
    /** One timespan per test, which also covers its hooks and fixture teardown. */
    Test: 'test',
} as const;

export type LighthouseMode = (typeof LighthouseMode)[keyof typeof LighthouseMode];

export const getLighthouseMode = (): LighthouseMode => {
    switch (process.env.LIGHTHOUSE) {
        case '1':
        case 'steps':
            return LighthouseMode.Steps;
        case 'test':
            return LighthouseMode.Test;
        default:
            return LighthouseMode.Off;
    }
};

export const isLighthouseEnabled = () => getLighthouseMode() !== LighthouseMode.Off;

/**
 * Web only: Playwright drives Chromium over a pipe, so the browser has to be launched with a
 * debugging port for Lighthouse to attach to.
 *
 * One port per parallel worker, so a parallel or sharded run does not fight over a single endpoint.
 * Playwright sets `TEST_PARALLEL_INDEX` before a worker loads the config, so the launch arguments
 * and the flow attaching to them agree on the number.
 */
export const getLighthouseDebugPort = () =>
    DEBUG_PORT_BASE + Number(process.env.TEST_PARALLEL_INDEX ?? 0);
