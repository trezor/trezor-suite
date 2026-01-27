import { defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import { tagsPr } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

const target = PlaywrightTarget.Desktop;

/*
 * Desktop PR config
 * This config is used to run tests on each PR
 * There are projects for all supported device models with the latest firmware version
 * Additionally we only run smoke tests on T3T1 model to reduce the total number of tests executed on each PR
 */
const config = defineConfig({
    ...baseConfig,
    projects: [
        new PlaywrightProjectBuilder(target, Model.T3W1)
            .addGrepInvert(/@nightlyOnly/)
            .setCurrentsTags(tagsPr)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T3T1, 'smoke')
            .setGrep(/(?=.*@T3T1)(?=.*@smoke)/)
            .addGrepInvert(/@nightlyOnly/)
            .setCurrentsTags(tagsPr)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T3B1)
            .addGrepInvert(/@nightlyOnly/)
            .setCurrentsTags(tagsPr)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T2T1)
            .addGrepInvert(/@nightlyOnly/)
            .setCurrentsTags(tagsPr)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T1B1)
            .addGrepInvert(/@nightlyOnly/)
            .setCurrentsTags(tagsPr)
            .build(),
        new PlaywrightProjectBuilder(target, 'no_device')
            .setGrep(/(?=.*@noDevice)/)
            .addGrepInvert(/@nightlyOnly/)
            .setCurrentsTags(tagsPr)
            .build(),
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
