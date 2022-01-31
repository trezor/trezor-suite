import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    timeout: 60 * 1000,
    retries: 3,
    use: {
        headless: process.env.HEADLESS === 'true',
    },
};
export default config;
