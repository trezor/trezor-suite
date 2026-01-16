import { defineConfig } from '@playwright/test';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';
const target = PlaywrightTarget.Web;
/*
 * Web general config
 * This config is used to run tests locally as well as in release testing
 * There are projects for all supported device models with the latest firmware version
 */
const config = defineConfig({
    ...baseConfig,
    projects: [
        new PlaywrightProjectBuilder(target, 'T3W1').build(),
        new PlaywrightProjectBuilder(target, 'T3T1').build(),
        new PlaywrightProjectBuilder(target, 'T3B1').build(),
        new PlaywrightProjectBuilder(target, 'T2T1').build(),
        new PlaywrightProjectBuilder(target, 'T1B1').build(),
        new PlaywrightProjectBuilder(target, 'no_device').addGrep(/(?=.*@noDevice)/).build(),
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
