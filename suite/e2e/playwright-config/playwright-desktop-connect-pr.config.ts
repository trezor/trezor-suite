import { defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsPr } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

/*
 * Desktop Connect PR config
 * This config is used to run trezor-connect e2e tests on PRs that change connect packages.
 * It only includes the trezor-connect test folder.
 */
const target = PlaywrightTarget.Desktop;
const definition: PlaywrightProjectDefinition[] = [
    {
        model: Model.T3T1,
        grep: /cancelling returns a Method_Cancel error/,
        additionalGrepInvert: /@skipOnPR/,
        currentsTags: tagsPr,
    },
];

const config = defineConfig({
    ...baseConfig,
    retries: 0,
    testDir: '../tests/trezor-connect',
    testMatch: /selectAccount\.test\.ts/,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
});

/* eslint-disable-next-line import/no-default-export */
export default config;
