import { PlaywrightTestConfig, devices } from '@playwright/test';

export const config: PlaywrightTestConfig = {
    testDir: 'e2e',
    retries: 0,
    workers: 1, // to disable parallelism between test files
    timeout: 40000,
    use: {
        headless: process.env.HEADLESS === 'true',
        ignoreHTTPSErrors: true,
        trace: 'retain-on-failure',
        ...devices['Desktop Chrome'],
    },
};
