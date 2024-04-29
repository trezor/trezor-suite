import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    retries: 0,
    workers: 1, // to disable parallelism between test files
    // loading core.js takes very long (in webextension). last time I checked it war 3mb. This is some development build or what?
    timeout: 60000,
    use: {
        headless: process.env.HEADLESS === 'true',
        ignoreHTTPSErrors: true,
        trace: 'retain-on-failure',
        ...devices['Desktop Chrome'],
    },
};
export default config;
