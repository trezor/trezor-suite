import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    retries: 0,
    workers: 1, // to disable parallelism between test files
    timeout: 60000,
    use: {
        headless: process.env.HEADLESS === 'true',
        ignoreHTTPSErrors: true,
        trace: 'on',
        video: 'on',
        screenshot: 'on',
        ...devices[process.env.MOBILE ? 'Pixel 7' : 'Desktop Chrome'],
    },
    reporter: process.env.GITHUB_ACTION
        ? [['@currents/playwright']] // CI run
        : [['list']], // Defaukt for local run
};

// eslint-disable-next-line import/no-default-export
export default config;
