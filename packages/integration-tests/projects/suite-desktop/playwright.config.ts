import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    timeout: 60000 * 10,
    retries: 0,
    workers: 1, // to disable parallelism between test files
    use: {
        trace: 'on',
        video: 'on',
        screenshot: 'on',
    },
};
export default config;
