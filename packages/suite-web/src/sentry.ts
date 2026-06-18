import {
    type BrowserOptions,
    type Span,
    init,
    setContext,
    setTag,
    startInactiveSpan,
    uiProfiler,
} from '@sentry/browser';

import { SENTRY_BROWSER_CONFIG, SENTRY_E2E_CONFIG } from '@suite/sentry';

const BROWSER_SENTRY_CONFIG: BrowserOptions = {
    ...SENTRY_BROWSER_CONFIG,
    integrations: defaults => [
        ...defaults.filter(i => i.name !== 'BrowserSession'),
        ...SENTRY_BROWSER_CONFIG.integrations,
    ],
};

export const initSentry = () => {
    init(BROWSER_SENTRY_CONFIG);
};

const E2E_SENTRY_CONFIG: BrowserOptions = {
    ...SENTRY_E2E_CONFIG,
    integrations: defaults => [
        ...defaults.filter(i => i.name !== 'BrowserSession'),
        ...SENTRY_E2E_CONFIG.integrations,
    ],
};

/**
 * Initializes Sentry for Playwright e2e profiling runs and exposes a `window.uiProfiler` handle that
 * the e2e harness drives via page.evaluate. Called from MainWeb only when the harness sets
 * `window.__SENTRY_E2E_PROFILING__`, so normal e2e runs stay Sentry-free.
 *
 * Each flow is wrapped in a named root transaction (`e2e: <test>`) so the standalone profile chunk —
 * which only carries a per-session profiler_id — correlates to a uniquely named transaction in the
 * Sentry UI, and is tagged with the test name/file for filtering.
 */
export const initSentryE2E = () => {
    init(E2E_SENTRY_CONFIG);

    let flowSpan: Span | undefined;

    window.uiProfiler = {
        startProfiler: meta => {
            if (meta?.test) {
                setTag('e2e.test', meta.test);
            }
            if (meta?.file) {
                setTag('e2e.file', meta.file);
            }
            setContext('e2e', meta ?? null);

            uiProfiler.startProfiler();
            flowSpan = startInactiveSpan({
                name: `e2e: ${meta?.test ?? 'flow'}`,
                op: 'e2e.flow',
                forceTransaction: true,
            });
        },
        stopProfiler: () => {
            flowSpan?.end();
            flowSpan = undefined;
            uiProfiler.stopProfiler();
        },
    };
};
