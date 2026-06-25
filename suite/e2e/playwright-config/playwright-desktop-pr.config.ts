import { defineConfig } from '@playwright/test';

import { noOtherDevice } from '@trezor/e2e-utils';
import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsPr } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

/*
 * Desktop PR config
 * This config is used to run tests on each PR
 * There are projects for all supported device models with the latest firmware version
 * To save Currents quota, T3W1 acts as the representative flagship and runs the full set; T3T1 runs only
 * its exclusive (T3T1-only) tests on PR. Shared T3W1/T3T1 tests get full T3T1 coverage in nightly instead.
 */
const target = PlaywrightTarget.Desktop;
const definition: PlaywrightProjectDefinition[] = [
    { model: Model.T3W1, additionalGrepInvert: /@nightlyOnly/, currentsTags: tagsPr },
    {
        model: Model.T3T1,
        additionalGrepInvert: /@nightlyOnly/,
        currentsTags: tagsPr,
        grep: new RegExp(`^(?=.*@T3T1)${noOtherDevice()}`),
    },
    { model: Model.T3B1, additionalGrepInvert: /@nightlyOnly/, currentsTags: tagsPr },
    { model: Model.T2T1, additionalGrepInvert: /@nightlyOnly/, currentsTags: tagsPr },
    { model: Model.T1B1, additionalGrepInvert: /@nightlyOnly/, currentsTags: tagsPr },
    {
        name: 'no_device',
        additionalGrepInvert: /@nightlyOnly/,
        currentsTags: tagsPr,
        grep: /^(?=.*@noDevice)/,
    },
];

const config = defineConfig({
    ...baseConfig,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
});

/* eslint-disable-next-line import/no-default-export */
export default config;
