// Synthetic manual tests for the reporter watchdog. describe.skip + empty bodies => never launch tenv/app,
// reported as Todo. Tagged @group=manual + @reporterWatchdog so only the real manual path (scoped by testFilter) runs them.
import { REPORTER_WATCHDOG_MANUAL_SAMPLES } from '@trezor/e2e-utils';

import { test } from '../support/fixtures';
import { createTestAnnotation } from '../support/reporters/annotations';

// eslint-disable-next-line playwright/no-skipped-test
test.describe.skip(
    'Reporter watchdog manual',
    { tag: ['@group=manual', '@reporterWatchdog'] },
    () => {
        REPORTER_WATCHDOG_MANUAL_SAMPLES.forEach(sample => {
            test(sample.testCase, { annotation: createTestAnnotation(sample) }, async () => {});
        });
    },
);
