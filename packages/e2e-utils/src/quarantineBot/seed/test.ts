/* eslint-disable import/no-extraneous-dependencies */
/**
 * Extended Playwright test object that includes Currents fixtures.
 *
 * Spreading both `baseFixtures` and `actionFixtures` ensures that:
 *   - Currents configuration is wired up (currentsConfig, ciBuildId, etc.)
 *   - Quarantine/skip actions from Currents are evaluated per-test so that
 *     a quarantined test is automatically skipped when running via `pwc`.
 */

import { type CurrentsFixtures, type CurrentsWorkerFixtures, fixtures } from '@currents/playwright';
import { test as base } from '@playwright/test';

export const test = base.extend<CurrentsFixtures, CurrentsWorkerFixtures>({
    ...fixtures.baseFixtures,
    ...fixtures.actionFixtures,
});
