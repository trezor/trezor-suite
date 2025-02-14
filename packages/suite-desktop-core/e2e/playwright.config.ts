import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export enum PlaywrightProjects {
    Web = 'web',
    Desktop = 'desktop',
}
const timeoutCIRun = 1000 * 180;
const timeoutLocalRun = 1000 * 60;

const config: PlaywrightTestConfig = {
    projects: [
        {
            name: PlaywrightProjects.Web,
            use: {
                ...devices['Desktop Chrome'],
                channel: 'chromium',
                baseURL: process.env.BASE_URL || 'http://localhost:8000/',
            },
            grepInvert: /@desktopOnly/,
        },
        {
            name: PlaywrightProjects.Desktop,
            use: {},
            grepInvert: /@webOnly/,
        },
    ],
    testDir: 'tests',
    workers: 1, // to disable parallelism between test files
    use: {
        viewport: { width: 1280, height: 720 },
        trace: 'on',
        video: 'on',
        screenshot: 'on',
        testIdAttribute: 'data-testid',
    },
    reportSlowTests: null,
    reporter: process.env.GITHUB_ACTION
        ? [['list'], ['@currents/playwright']]
        : [['list'], ['html', { open: 'never' }]],
    timeout: process.env.GITHUB_ACTION ? timeoutCIRun : timeoutLocalRun,
    outputDir: path.join(__dirname, 'test-results'),
    snapshotPathTemplate: 'snapshots/{projectName}/{testFilePath}/{arg}{ext}',
};

// eslint-disable-next-line import/no-default-export
export default config;
