interface Window {
    // Needed for Cypress and Playwright
    Playwright?: any;
    TrezorConnect?: any;
    store?: any;
    // Set by the Playwright e2e harness to init Sentry with the dedicated e2e profiling config.
    __SENTRY_E2E_PROFILING__?: boolean;
    // Exposed by initSentryE2E so the e2e harness can profile each test flow.
    uiProfiler?: {
        startProfiler: (meta?: { test?: string; file?: string }) => void;
        stopProfiler: () => void;
    };
}
