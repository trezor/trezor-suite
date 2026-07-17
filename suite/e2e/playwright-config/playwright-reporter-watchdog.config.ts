import { defineConfig } from '@playwright/test';

import { baseConfig } from './playwright-base.config';

// Runs the automated watchdog synthetic tests; grepInvert keeps the manual specs out (they run via the real manual path).
const config = defineConfig({
    ...baseConfig,
    testDir: '../reporter-watchdog',
    projects: [
        {
            name: 'reporterWatchdog',
            grep: /@reporterWatchdog/,
            grepInvert: /@group=manual/,
        },
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
