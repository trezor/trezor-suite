import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    timeout: 360000, // tests can take long, especially due to tor
    workers: 1, // to disable parallelism between test files
    use: {
        headless: false,
        video: 'on',
        screenshot: 'on',
        trace: 'on',
    },
};
export default config;
