import { PlaywrightTestOptions, PlaywrightWorkerOptions, defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsCanary } from './projectTags';
import { PlaywrightTarget, SuiteTestOptions } from '../support/testExtends/suiteTestOptions';

/*
 * Desktop Canary config
 * This config runs only the canary FW projects once a week (Fridays).
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
    {
        model: Model.T3T1,
        nameSuffix: 'fw_canary_smoke',
        firmware: '2-main',
        grep: /^(?=.*@T3T1)(?=.*@smoke)/,
        additionalGrepInvert: /@specificFirmware/,
        currentsTags: tagsCanary,
    },
    {
        model: Model.T3B1,
        nameSuffix: 'fw_canary',
        firmware: '2-main',
        additionalGrepInvert: /@specificFirmware/,
        currentsTags: tagsCanary,
    },
    {
        model: Model.T2T1,
        nameSuffix: 'fw_canary',
        firmware: '2-main',
        additionalGrepInvert: /@specificFirmware/,
        currentsTags: tagsCanary,
    },
    {
        model: Model.T1B1,
        nameSuffix: 'fw_canary',
        firmware: '1-main',
        additionalGrepInvert: /@specificFirmware/,
        currentsTags: tagsCanary,
    },
];

const config = defineConfig<SuiteTestOptions & PlaywrightTestOptions, PlaywrightWorkerOptions>({
    ...baseConfig,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
});

/* eslint-disable-next-line import/no-default-export */
export default config;
