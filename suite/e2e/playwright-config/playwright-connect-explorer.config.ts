import { defineConfig, devices } from '@playwright/test';

import { baseConfig } from './playwright-base.config';
import { getConnectExplorerUrl } from '../support/helpers/connectExplorer';

/*
 * Connect Explorer UI config.
 * Device-free suite covering the explorer app itself (navigation, content, chrome and the shell of
 * the method testing tool). It runs against `yarn connect:explorer` locally or against the explorer
 * set in `CONNECT_EXPLORER_URL`, needs no trezor-user-env, bridge or emulator, and reports without
 * Currents.
 */
// `baseConfig` is annotated as `PlaywrightTestConfig`, which erases the Currents fixture options.
const { currentsFixturesEnabled: _currentsFixturesEnabled, ...baseUse } = (baseConfig.use ??
    {}) as NonNullable<typeof baseConfig.use> & { currentsFixturesEnabled?: boolean };

const config = defineConfig({
    ...baseConfig,
    testDir: '../tests/connect-explorer',
    // A cold `yarn connect:explorer` compiles each route on first request, which overruns
    // Playwright's 5 s `expect` default and still fits the 90 s local test timeout. The deployed
    // preview is a static export and is not affected.
    expect: { timeout: 1000 * 30 },
    reporter: process.env.GITHUB_ACTION
        ? [['list'], ['github'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'never' }]],
    use: {
        ...baseUse,
        baseURL: getConnectExplorerUrl(),
    },
    projects: [
        {
            name: 'connect_explorer',
            use: { ...devices['Desktop Chrome'], viewport: baseUse.viewport },
        },
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
