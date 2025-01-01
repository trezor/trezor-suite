import path from 'path';
import type { PlaywrightTestConfig } from '@playwright/test';

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
                browserName: 'chromium',
                baseURL: process.env.BASE_URL || 'http://localhost:8000/',
            },
            grepInvert: /@desktopOnly/,
            //TODO: #16073 Instability on Web tests. Once solved, remove ignoreSnapshots
            ignoreSnapshots: true,
        },
        {
            name: PlaywrightProjects.Desktop,
            use: {},
            grepInvert: /@webOnly/,
            //TODO: #16073 We cannot set resolution for Electron. Once solved, remove ignoreSnapshots
            ignoreSnapshots: true,
        },
    ],
    testDir: 'tests',
    workers: 1, // to disable parallelism between test files
    use: {
        viewport: { width: 1280, height: 720 },
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
    snapshotPathTemplate: 'snapshots/{projectName}/{testFilePath}/{arg}{ext}',
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.001,
        },
    },
};

// eslint-disable-next-line import/no-default-export
export default config;
