import { defineConfig } from '@playwright/test';

import { PlaywrightTarget, baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';

const target = PlaywrightTarget.Web;

const config = defineConfig({
    ...baseConfig,
    projects: [
        new PlaywrightProjectBuilder(target, 'T3W1').setGrep(/(?=.*@T3W1)(?=.*@webOnly)/).build(),
        new PlaywrightProjectBuilder(target, 'T3T1_smoke')
            .setModel('T3T1')
            .setGrep(/(?=.*@T3T1)(?=.*@smoke)(?=.*@webOnly)/)
            .build(),
        new PlaywrightProjectBuilder(target, 'T3B1').setGrep(/(?=.*@T3B1)(?=.*@webOnly)/).build(),
        new PlaywrightProjectBuilder(target, 'T2T1').setGrep(/(?=.*@T2T1)(?=.*@webOnly)/).build(),
        new PlaywrightProjectBuilder(target, 'T1B1').setGrep(/(?=.*@T1B1)(?=.*@webOnly)/).build(),
        new PlaywrightProjectBuilder(target, 'no_device')
            .setModel('T1B1') // model has to be set even when not used
            .setGrep(/(?=.*@noDevice)(?=.*@webOnly)/)
            .build(),
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
