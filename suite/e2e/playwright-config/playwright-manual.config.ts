import { defineConfig } from '@playwright/test';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

const config = defineConfig({
    ...baseConfig,
    projects: [
        new PlaywrightProjectBuilder(PlaywrightTarget.Web, 'manual')
            .setGrep(/@group=manual/)
            .build(),
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
