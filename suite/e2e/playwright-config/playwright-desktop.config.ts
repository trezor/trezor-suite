import { defineConfig } from '@playwright/test';

import { PlaywrightTarget, baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';

const target = PlaywrightTarget.Desktop;

const config = defineConfig({
    ...baseConfig,
    projects: [
        new PlaywrightProjectBuilder(target, 'T3W1').build(),
        new PlaywrightProjectBuilder(target, 'T3T1').build(),
        new PlaywrightProjectBuilder(target, 'T3B1').build(),
        new PlaywrightProjectBuilder(target, 'T2T1').build(),
        new PlaywrightProjectBuilder(target, 'T1B1').build(),
        new PlaywrightProjectBuilder(target, 'no_device')
            .setModel('T1B1') // model has to be set even when not used
            .addGrep(/(?=.*@noDevice)/)
            .build(),
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
