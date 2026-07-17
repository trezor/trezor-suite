// Synthetic manual tests for the reporter watchdog. describe.skip + empty bodies => reported as Todo.
// The /manual/ path segment is what makes the reporter classify them as manual (Jest has no tags).
import { REPORTER_WATCHDOG_NATIVE_MANUAL_SAMPLES } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Reporter watchdog native manual', () => {
    REPORTER_WATCHDOG_NATIVE_MANUAL_SAMPLES.forEach(sample => {
        it(sample.testCase, sample, async () => {});
    });
});
