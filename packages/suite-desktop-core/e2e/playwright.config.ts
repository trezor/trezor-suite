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
    },
    reportSlowTests: null,
    reporter: [
        ['list'],
        [
            '@currents/playwright',
            {
                projectId: 'UhX3H3',
                recordKey: 'XrpKsbPcw3L3tfHZ',
                ciBuildId: 'hello-currents2',
            },
        ],
    ],
    timeout: 1000 * 60 * 30,
    outputDir: path.join(__dirname, 'test-results'),
};

// eslint-disable-next-line import/no-default-export
export default config;
