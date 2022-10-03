import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    timeout: 360000, // tests can take long, especially due to Tor
    workers: 1, // to disable parallelism between test files
    use: {
        headless: true,
    },
};

// eslint-disable-next-line import/no-default-export
export default config;
