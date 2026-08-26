import { defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

// Harness-only onboarding for the llmExploratoryTester. Outside suite/e2e/tests so
// nightly/PR discovery never picks these specs up.
// Uses main (canary) firmware — same as local canary runs — so the agent exercises
// the newest FW features available in trezor-user-env.
const target = PlaywrightTarget.Web;
const definition: PlaywrightProjectDefinition[] = [
    { model: Model.T3W1, firmware: '2-main' },
    { model: Model.T3T1, firmware: '2-main' },
    { model: Model.T3B1, firmware: '2-main' },
    { model: Model.T2T1, firmware: '2-main' },
    { model: Model.T1B1, firmware: '1-main' },
];

const config = defineConfig({
    ...baseConfig,
    testDir: '../llmExploratoryTester',
    // Full onboarding + discovery exceeds the base timeouts; matches the
    // harness's SETUP_TIMEOUT_MS deadline in llmExploratoryTester/setup.ts (10 minutes).
    timeout: 600_000,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
    use: {
        ...baseConfig.use,
        baseURL: process.env.BASE_URL,
        trace: 'off',
        video: 'off',
        headless: process.env.HEADLESS !== 'false',
        launchOptions: {
            args: [
                '--remote-debugging-port=9222',
                // Suite talks to the local bridge (127.0.0.1), which triggers Chrome's
                // Local Network Access permission prompt. Disable the check so it can
                // never block the agent (Playwright grantPermissions does not survive).
                '--disable-features=LocalNetworkAccessChecks',
                '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
            ],
        },
    },
});

/* eslint-disable-next-line import/no-default-export */
export default config;
