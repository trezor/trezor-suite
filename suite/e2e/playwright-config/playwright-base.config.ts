import { CurrentsFixtures, CurrentsWorkerFixtures } from '@currents/playwright';
import type { PlaywrightTestConfig, ReporterDescription } from '@playwright/test';
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// quiet: true suppresses dotenv's stdout banner, which otherwise breaks currents' `pwc-p discover`
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

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
    forbidOnly: isDefaultGithubAction,
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
    // Orchestrated CI runs use `pwc-p run --pwc-skip-reporter-injection`, so reporters must be
    // declared here rather than injected by the CLI. The GitHub reporter is opt-in via env.
    reporter: isDefaultGithubAction
        ? [
              ['@currents/playwright'] as ReporterDescription,
              ...(process.env.RUN_GITHUB_REPORTER === 'true'
                  ? [
                        [
                            path.join(__dirname, '../support/reporters/gitHubReporter.ts'),
                        ] as ReporterDescription,
                    ]
                  : []),
              // A no-op unless a perf-measured test ran.
              [path.join(__dirname, '../performance/perfReporter.ts')] as ReporterDescription,
          ] // CI run
        : [
              ['list'],
              ['html', { open: 'never' }],
              // A no-op unless a perf-measured test ran.
              [path.join(__dirname, '../performance/perfReporter.ts')] as ReporterDescription,
          ], // Local run or Fix Agent CI run
    timeout: getTimeout(),
    outputDir: path.join(__dirname, '../test-results'),
});
