// Synthetic automated tests for the reporter watchdog. Bare @playwright/test (no fixtures/tenv/app)
// so they run instantly. Tagged only @reporterWatchdog, so no real project selects them (see playwright-project-builder).
import { expect, test } from '@playwright/test';

import { REPORTER_WATCHDOG_AUTOMATED_SAMPLES } from '@trezor/e2e-utils';

REPORTER_WATCHDOG_AUTOMATED_SAMPLES.forEach(sample => {
    test(sample.testCase, { tag: ['@reporterWatchdog'] }, () => {
        expect(sample.shouldFail).toBe(false);
    });
});
