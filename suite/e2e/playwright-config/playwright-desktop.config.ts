import { defineConfig } from '@playwright/test';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import { tagsRelease } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

const target = PlaywrightTarget.Desktop;

/*
 * Desktop general config
 * This config is used to run tests locally as well as in release testing
 * There are projects for all supported device models with the latest firmware version
 */
const config = defineConfig({
    ...baseConfig,
    projects: [
        new PlaywrightProjectBuilder(target, 'T3W1').setCurrentsTags(tagsRelease).build(),
        new PlaywrightProjectBuilder(target, 'T3T1').setCurrentsTags(tagsRelease).build(),
        new PlaywrightProjectBuilder(target, 'T3B1').setCurrentsTags(tagsRelease).build(),
        new PlaywrightProjectBuilder(target, 'T2T1').setCurrentsTags(tagsRelease).build(),
        new PlaywrightProjectBuilder(target, 'T1B1').setCurrentsTags(tagsRelease).build(),
        new PlaywrightProjectBuilder(target, 'no_device')
            .addGrep(/(?=.*@noDevice)/)
            .setCurrentsTags(tagsRelease)
            .build(),
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
