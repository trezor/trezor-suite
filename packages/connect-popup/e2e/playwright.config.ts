import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    retries: 0,
    workers: 1, // to disable parallelism between test files
    timeout: 60000,
    use: {
        headless: process.env.HEADLESS === 'true',
        ignoreHTTPSErrors: true,
        trace: 'retain-on-failure',
        ...devices[process.env.MOBILE ? 'Pixel 7' : 'Desktop Chrome'],
    },
};
export default config;
