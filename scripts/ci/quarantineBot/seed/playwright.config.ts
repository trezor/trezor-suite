/* eslint-disable import/no-extraneous-dependencies, import/no-default-export */
/**
 * Playwright config for seeding fake test results into Currents.dev.
 *
 * Target project: Experimental Playground (iBEsWE)
 *
 * Required env vars:
 *   CURRENTS_RECORD_KEY   – your Currents record key
 *
 * Optional env vars (see fake-tests.spec.ts for the full list):
 *   CURRENTS_CI_BUILD_ID  – custom build ID (defaults to seed-<timestamp>)
 *   CURRENTS_TAG          – comma-separated tags to attach to the run
 */

import { currentsReporter } from '@currents/playwright';
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.',
    testMatch: 'fake-tests.spec.ts',
    fullyParallel: true,
    workers: 4,
    retries: 0,
    reporter: [
        ['list'],
        currentsReporter({
            ciBuildId: process.env.CURRENTS_CI_BUILD_ID ?? `seed-${Date.now()}`,
            recordKey: process.env.CURRENTS_RECORD_KEY!,
            projectId: 'iBEsWE', // Experimental Playground project ID
            tag: process.env.CURRENTS_TAG?.split(',').filter(Boolean) ?? ['seed'],
        }),
    ],
});
