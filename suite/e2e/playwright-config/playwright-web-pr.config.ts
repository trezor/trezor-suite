import { defineConfig } from '@playwright/test';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

const target = PlaywrightTarget.Web;

/*
 * Web PR config
 * This config is used to run tests on each PR
 * There are projects for all supported device models with the latest firmware version
 * Additionally we only run smoke tests on T3T1 model and tests tagged as @webOnly to reduce the total number of tests executed on each PR
 */
const config = defineConfig({
    ...baseConfig,
    projects: [
        new PlaywrightProjectBuilder(target, 'T3W1')
            .setGrep(/(?=.*@T3W1)(?=.*@webOnly)/)
            .addGrepInvert(/@nightlyOnly/)
            .build(),
        new PlaywrightProjectBuilder(target, 'T3T1', 'smoke')
            .setGrep(/(?=.*@T3T1)(?=.*@smoke)(?=.*@webOnly)/)
            .addGrepInvert(/@nightlyOnly/)
            .build(),
        new PlaywrightProjectBuilder(target, 'T3B1')
            .setGrep(/(?=.*@T3B1)(?=.*@webOnly)/)
            .addGrepInvert(/@nightlyOnly/)
            .build(),
        new PlaywrightProjectBuilder(target, 'T2T1')
            .setGrep(/(?=.*@T2T1)(?=.*@webOnly)/)
            .addGrepInvert(/@nightlyOnly/)
            .build(),
        new PlaywrightProjectBuilder(target, 'T1B1')
            .setGrep(/(?=.*@T1B1)(?=.*@webOnly)/)
            .addGrepInvert(/@nightlyOnly/)
            .build(),
        new PlaywrightProjectBuilder(target, 'no_device')
            .setGrep(/(?=.*@noDevice)(?=.*@webOnly)/)
            .addGrepInvert(/@nightlyOnly/)
            .build(),
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
