import { defineConfig } from '@playwright/test';

import { PlaywrightTarget, baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';

const config = defineConfig({
    ...baseConfig,
    projects: [
        new PlaywrightProjectBuilder(PlaywrightTarget.Web, 'manual')
            .setModel('T1B1') // model has to be set even when not used
            .setGrep(/@group=manual/)
            .build(),
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
