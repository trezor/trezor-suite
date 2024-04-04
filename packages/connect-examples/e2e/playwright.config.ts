import { PlaywrightTestConfig, devices } from '@playwright/test';
import path from 'path';

export const config: PlaywrightTestConfig = {
    testDir: 'tests',
    retries: 0,
    workers: 1, // to disable parallelism between test files
    timeout: 40000,
    use: {
        headless: process.env.HEADLESS === 'true',
        ignoreHTTPSErrors: true,
        trace: 'retain-on-failure',
        ...devices['Desktop Chrome'],
    },
    outputDir: path.join(__dirname, 'test-results'),
};
