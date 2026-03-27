import { defineConfig } from '@playwright/test';

import { noOtherDevice } from '@trezor/e2e-utils';
import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsPr } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

/*
 * Web PR config
 * This config is used to run tests on each PR
 * There are projects for all supported device models with the latest firmware version
 * Additionally we only run smoke tests on T3T1 model and tests tagged as @webOnly to reduce the total number of tests executed on each PR
 */
const target = PlaywrightTarget.Web;
const definition: PlaywrightProjectDefinition[] = [
    {
        model: Model.T3W1,
        additionalGrepInvert: /@nightlyOnly/,
        currentsTags: tagsPr,
        grep: /^(?=.*@T3W1)(?=.*@webOnly)/,
    },
    {
        model: Model.T3T1,
        additionalGrepInvert: /@nightlyOnly/,
        currentsTags: tagsPr,
        nameSuffix: 'smoke',
        grep: new RegExp(`^(?=.*@T3T1)(?=.*@webOnly)((?=.*@smoke)|${noOtherDevice()})`),
    },
    {
        model: Model.T3B1,
        additionalGrepInvert: /@nightlyOnly/,
        currentsTags: tagsPr,
        grep: /^(?=.*@T3B1)(?=.*@webOnly)/,
    },
    {
        model: Model.T2T1,
        additionalGrepInvert: /@nightlyOnly/,
        currentsTags: tagsPr,
        grep: /^(?=.*@T2T1)(?=.*@webOnly)/,
    },
    {
        model: Model.T1B1,
        additionalGrepInvert: /@nightlyOnly/,
        currentsTags: tagsPr,
        grep: /^(?=.*@T1B1)(?=.*@webOnly)/,
    },
    {
        name: 'no_device',
        additionalGrepInvert: /@nightlyOnly/,
        currentsTags: tagsPr,
        grep: /^(?=.*@noDevice)(?=.*@webOnly)/,
    },
];

const config = defineConfig({
    ...baseConfig,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
});

/* eslint-disable-next-line import/no-default-export */
export default config;
