import { defineConfig } from '@playwright/test';

import { baseConfig } from './playwright-base.config';

// Real release sanity test reporter discovers the manual tests under tests/.
// In reporter-watchdog mode the synthetic manual specs live in their own reporter-watchdog/ folder instead.
const config = defineConfig({
    ...baseConfig,
    testDir: process.env.REPORTER_WATCHDOG === 'true' ? '../reporter-watchdog' : '../tests',
    projects: [
        {
            name: 'manual',
            grep: /@group=manual/,
        },
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
