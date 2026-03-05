/* eslint-disable import/no-extraneous-dependencies */
/**
 * Seeder for Currents.dev test health-check.
 *
 * Contains ONE test with a stable name. Each invocation of this script is a
 * separate Currents run, so running it N times gives that one test N data
 * points in the Tests Explorer. That is the history the health-check uses to
 * decide on quarantine/unquarantine.
 *
 * Run this via the Currents playwright wrapper CLI (pwc) so results are
 * reported to the Currents dashboard with the full titlePath that the
 * quarantine bot uses for its matcher.
 *
 *   pwc --config seed/playwright.config.ts
 *
 * --- Environment variables ------------------------------------------------
 *
 *   SEED_FAIL              Set to "true" to make the test fail in this run.
 *                          Default: false (test passes)
 *
 *   SEED_DESCRIBE_NAME     Override the describe-block label.
 *                          Default: "Seeder"
 *
 *   SEED_TEST_NAME         Override the stable test title.
 *                          Default: "canary: health-check seed test"
 *
 * --- Workflow for triggering quarantine -----------------------------------
 *
 *   # Fail the test in 5 consecutive runs → 100% failure rate → quarantined:
 *   for i in 1 2 3 4 5; do
 *     SEED_FAIL=true CURRENTS_RECORD_KEY=xxx \
 *       pwc --config seed/playwright.config.ts
 *   done
 *
 *   # Then pass in 5 runs → failure rate drops → unquarantined:
 *   for i in 1 2 3 4 5; do
 *     CURRENTS_RECORD_KEY=xxx \
 *       pwc --config seed/playwright.config.ts
 *   done
 */

import { expect } from '@playwright/test';

import { test } from './test';

const SEED_FAIL = process.env.SEED_FAIL === 'true';
const SEED_DESCRIBE_NAME = process.env.SEED_DESCRIBE_NAME ?? 'Seeder';
const SEED_TEST_NAME = process.env.SEED_TEST_NAME ?? 'canary: health-check seed test';

test.describe(SEED_DESCRIBE_NAME, () => {
    test(SEED_TEST_NAME, () => {
        if (SEED_FAIL) {
            expect(false, `[seed] Intentional failure: ${SEED_TEST_NAME}`).toBe(true);
        } else {
            expect(true).toBe(true);
        }
    });
});
