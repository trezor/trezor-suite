import { defineConfig } from '@playwright/test';

import { baseConfig } from './playwright-base.config';

const config = defineConfig({
    ...baseConfig,
    projects: [
        {
            name: 'manual',
            grep: /@group=manual/,
        },
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
