import { CurrentsFixtures, CurrentsWorkerFixtures } from '@currents/playwright';
import type { PlaywrightTestConfig } from '@playwright/test';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export enum PlaywrightProjects {
    Web = 'web',
    Desktop = 'desktop',
    Manual = 'manual',
}

const CI_TIMEOUT = 1000 * 180;
const LOCAL_TIMEOUT = 1000 * 90;

function getTimeout(): number {
    if (process.env.TEST_TIMEOUT_OVERRIDE) {
        return Number(process.env.TEST_TIMEOUT_OVERRIDE);
    }

    return process.env.GITHUB_ACTION ? CI_TIMEOUT : LOCAL_TIMEOUT;
}

function getReporter(): PlaywrightTestConfig['reporter'] {
    // Release - Manual regression: Generate manual suite in GitHub, without currents involvement
    if (process.env.RUN_REPORTER === 'manual') {
        return [['./support/reporters/gitHubReporter.ts']];
    }

    // Local run
    if (!process.env.GITHUB_ACTION) {
        return [['list'], ['html', { open: 'never' }]];
    }

    // Release - Automated CI run: Report results both in Currents and GitHub
    if (process.env.RUN_REPORTER === 'true') {
        return [['@currents/playwright'], ['./support/reporters/gitHubReporter.ts']];
    }

    // Default run on CI: Report results only in Currents
    return [['@currents/playwright']];
}

const config: PlaywrightTestConfig = defineConfig<CurrentsFixtures, CurrentsWorkerFixtures>({
    projects: [
        {
            name: PlaywrightProjects.Web,
            use: {
                ...devices['Desktop Chrome'],
                channel: 'chromium',
                baseURL: process.env.BASE_URL || 'http://localhost:8000/',
            },
            grepInvert: [/@desktopOnly/, /@group=manual/],
        },
        {
            name: PlaywrightProjects.Desktop,
            use: {},
            grepInvert: [/@webOnly/, /@group=manual/],
        },
        {
            name: PlaywrightProjects.Manual,
            use: {},
            grep: /@group=manual/,
        },
    ],
    testDir: 'tests',
    workers: 1, // to disable parallelism between test files
    retries: process.env.GITHUB_ACTION ? 2 : 0,
    use: {
        viewport: { width: 1280, height: 720 },
        trace: 'on',
        video: 'on',
        screenshot: 'on',
        testIdAttribute: 'data-testid',
        actionTimeout: 1000 * 15,
        currentsFixturesEnabled: !!process.env.GITHUB_ACTION,
    },
    reportSlowTests: null,
    reporter: getReporter(),
    timeout: getTimeout(),
    outputDir: path.join(__dirname, 'test-results'),
    snapshotPathTemplate: 'snapshots/{projectName}/{testFilePath}/{arg}{ext}',
});

// eslint-disable-next-line import/no-default-export
export default config;
