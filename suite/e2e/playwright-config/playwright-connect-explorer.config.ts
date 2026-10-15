import { defineConfig, devices } from '@playwright/test';

import { baseConfig } from './playwright-base.config';
import { getConnectExplorerUrl } from '../support/helpers/connectExplorer';

/*
 * Connect Explorer UI config.
 * Device-free suite covering the explorer app itself (navigation, content, chrome and the shell of
 * the method testing tool). It runs against a deployed per-PR preview in CI and against
 * `yarn connect:explorer` locally, needs no trezor-user-env, bridge or emulator, and reports
 * without Currents.
 */
// `baseConfig` is annotated as `PlaywrightTestConfig`, which erases the Currents fixture options.
const { currentsFixturesEnabled: _currentsFixturesEnabled, ...baseUse } = (baseConfig.use ??
    {}) as NonNullable<typeof baseConfig.use> & { currentsFixturesEnabled?: boolean };

const config = defineConfig({
    ...baseConfig,
    testDir: '../tests/connect-explorer',
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
