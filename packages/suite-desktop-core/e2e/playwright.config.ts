import path from 'path';
import type { PlaywrightTestConfig } from '@playwright/test';

export enum PlaywrightProjects {
    Web = 'web',
    Desktop = 'desktop',
}
const timeoutCIRun = 1000 * 60;
const timeoutLocalRun = 1000 * 30;

const config: PlaywrightTestConfig = {
    projects: [
        {
            name: PlaywrightProjects.Web,
            use: {
                browserName: 'chromium',
                baseURL: process.env.BASE_URL || 'http://localhost:8000/',
            },
            grepInvert: /@desktopOnly/,
        },
        {
            name: PlaywrightProjects.Desktop,
            use: {},
        },
    ],
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
    reporter: process.env.GITHUB_ACTION
        ? [['list'], ['@currents/playwright'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'never' }]],
    timeout: process.env.GITHUB_ACTION ? timeoutCIRun : timeoutLocalRun,
    outputDir: path.join(__dirname, 'test-results'),
};

// eslint-disable-next-line import/no-default-export
export default config;
