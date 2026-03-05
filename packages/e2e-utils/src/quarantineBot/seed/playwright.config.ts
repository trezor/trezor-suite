/* eslint-disable import/no-extraneous-dependencies, import/no-default-export */
/**
 * Playwright config for seeding fake test results into Currents.dev.
 *
 * Target project: Experimental Playground (iBEsWE)
 *
 * Run via the Currents playwright wrapper CLI so Currents configuration is
 * picked up from currents.config.ts rather than embedded in this file:
 *
 *   pwc --config seed/playwright.config.ts
 *
 * Required env vars (read by currents.config.ts):
 *   CURRENTS_RECORD_KEY   – your Currents record key
 *
 * Optional env vars:
 *   CURRENTS_CI_BUILD_ID  – custom build ID (defaults to seed-<timestamp>)
 *   CURRENTS_TAG          – comma-separated tags to attach to the run
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.',
    testMatch: 'fake-tests.spec.ts',
    fullyParallel: true,
    workers: 4,
    retries: 0,
    reporter: [['list']],
});
