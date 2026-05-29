import { CurrentsFixtures, CurrentsWorkerFixtures } from '@currents/playwright';
import type { PlaywrightTestConfig } from '@playwright/test';
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CI_TIMEOUT = 1000 * 180;
const LOCAL_TIMEOUT = 1000 * 90;
const isDefaultGithubAction = !!process.env.GITHUB_ACTION && !process.env.AGENT_GITHUB_ACTION;

function getTimeout(): number {
    if (process.env.TEST_TIMEOUT_OVERRIDE) {
        return Number(process.env.TEST_TIMEOUT_OVERRIDE);
    }

    return process.env.GITHUB_ACTION || process.env.AGENT_GITHUB_ACTION
        ? CI_TIMEOUT
        : LOCAL_TIMEOUT;
}

export const baseConfig: PlaywrightTestConfig = defineConfig<
    CurrentsFixtures,
    CurrentsWorkerFixtures
>({
    projects: [],
    testDir: '../tests',
    workers: 1, // to disable parallelism between test files
    retries: isDefaultGithubAction ? 2 : 0,
    use: {
        viewport: { width: 1280, height: 720 },
        trace: 'on',
        video: 'on',
        screenshot: 'on',
        testIdAttribute: 'data-testid',
        actionTimeout: 1000 * 15,
        currentsFixturesEnabled: isDefaultGithubAction,
    },
    reportSlowTests: null,
    // GitHub Reporter for release is called thru CLI (workflows and package.json)
    reporter: isDefaultGithubAction
        ? [['@currents/playwright']] // CI run
        : [['list'], ['html', { open: 'never' }]], // Local run or Fix Agent CI run
    timeout: getTimeout(),
    outputDir: path.join(__dirname, '../test-results'),
});
