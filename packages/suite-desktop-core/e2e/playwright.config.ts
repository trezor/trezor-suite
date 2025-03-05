import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export enum PlaywrightProjects {
    Web = 'web',
    Desktop = 'desktop',
}

const CI_TIMEOUT = 1000 * 180;
const LOCAL_TIMEOUT = 1000 * 90;

function getTimeout(): number {
    if (process.env.TEST_TIMEOUT_OVERRIDE) {
        return Number(process.env.TEST_TIMEOUT_OVERRIDE);
    }

    return process.env.GITHUB_ACTION ? CI_TIMEOUT : LOCAL_TIMEOUT;
}

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
        actionTimeout: 1000 * 15,
    },
    reportSlowTests: null,
    reporter: process.env.GITHUB_ACTION
        ? [['list'], ['@currents/playwright']]
        : [['list'], ['html', { open: 'never' }]],
    timeout: getTimeout(),
    outputDir: path.join(__dirname, 'test-results'),
    snapshotPathTemplate: 'snapshots/{projectName}/{testFilePath}/{arg}{ext}',
};

// eslint-disable-next-line import/no-default-export
export default config;
