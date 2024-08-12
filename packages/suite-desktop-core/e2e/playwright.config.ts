import path from 'path';
import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    workers: 1, // to disable parallelism between test files
    use: {
        headless: process.env.HEADLESS === 'true',
        trace: 'on',
        video: 'on',
        screenshot: 'on',
        testIdAttribute: 'data-testid',
    },
    reportSlowTests: null,
    reporter: process.env.GITHUB_ACTION ? [['list'], ['@currents/playwright']] : [['list']],
    timeout: 1000 * 60 * 30,
    outputDir: path.join(__dirname, 'test-results'),
};

// eslint-disable-next-line import/no-default-export
export default config;
