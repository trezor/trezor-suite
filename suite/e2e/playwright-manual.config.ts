import { defineConfig } from '@playwright/test';

import { baseConfig } from './playwright-base.config';

const config = defineConfig({
    ...baseConfig,
    projects: [
        {
            name: 'manual',
            use: {
                model: 'T1B1', // model has to be set even when not used
            },
            grep: /@group=manual/,
        },
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
