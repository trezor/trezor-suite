import { defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsCanary } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

/*
 * Desktop PR config
 * This config is used to run tests on each PR
 * There are projects for all supported device models with the latest firmware version
 * Additionally we only run smoke tests on T3T1 model to reduce the total number of tests executed on each PR
 */
const target = PlaywrightTarget.Desktop;
const definition: PlaywrightProjectDefinition[] = [
    {
        model: Model.T3W1,
        nameSuffix: 'fw_canary',
        firmware: '2-main',
        additionalGrepInvert: /@specificFirmware/,
        currentsTags: tagsCanary,
    },
];

const config = defineConfig({
    ...baseConfig,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
});

/* eslint-disable-next-line import/no-default-export */
export default config;
