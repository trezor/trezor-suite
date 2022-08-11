import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    timeout: 60000 * 5,
    retries: 0,
    workers: 1, // to disable parallelism between test files
    use: {
        // ?
        // headless: process.env.HEADLESS === 'true',
        // ignoreHTTPSErrors: true,
        // trace: 'retain-on-failure',
        trace: 'on',
    },
};
export default config;
