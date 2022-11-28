import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    retries: 0,
    workers: 1, // to disable parallelism between test files
    timeout: 60000,
    use: {
        headless: process.env.HEADLESS === 'true',
        ignoreHTTPSErrors: true,
        trace: 'retain-on-failure',
    },
};
export default config;
