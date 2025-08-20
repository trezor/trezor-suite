import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    retries: 0,
    workers: 1, // to disable parallelism between test files
    timeout: 30000,
    use: {
        headless: process.env.HEADLESS === 'true',
        ignoreHTTPSErrors: true,
        trace: 'on',
        video: 'on',
        screenshot: 'on',
    },
    reporter: process.env.GITHUB_ACTION
        ? [['@currents/playwright']] // CI run
        : [['list']], // Default for local run
};
export default config;
