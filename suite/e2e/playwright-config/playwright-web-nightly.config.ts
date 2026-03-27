import { defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsCanary, tagsNightly } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

/*
 * Web Nightly config
 * This config is used to run tests once a day against the latest web application build (nightly).
 * There are projects for all supported device models with the latest and main (canary) firmware versions
 * With the canary FW, we only run smoke tests on T3T1 model and tests tagged as @webOnly to reduce the total number of tests executed
 */
const target = PlaywrightTarget.Web;
const definition: PlaywrightProjectDefinition[] = [
    { model: Model.T3W1, currentsTags: tagsNightly },
    { model: Model.T3T1, currentsTags: tagsNightly },
    { model: Model.T3B1, currentsTags: tagsNightly },
    { model: Model.T2T1, currentsTags: tagsNightly },
    { model: Model.T1B1, currentsTags: tagsNightly },
    { name: 'no_device', currentsTags: tagsNightly, grep: /^(?=.*@noDevice)/ },
    // FW Canary projects
    {
        model: Model.T3W1,
        nameSuffix: 'fw_canary',
        firmware: '2-main',
        grep: /^(?=.*@T3W1)(?=.*@webOnly)/,
        additionalGrepInvert: /@specificFirmware/,
        currentsTags: tagsCanary,
    },
    {
        model: Model.T3T1,
        nameSuffix: 'fw_canary_smoke',
        firmware: '2-main',
        grep: /^(?=.*@T3T1)(?=.*@smoke)(?=.*@webOnly)/,
        additionalGrepInvert: /@specificFirmware/,
        currentsTags: tagsCanary,
    },
    {
        model: Model.T3B1,
        nameSuffix: 'fw_canary',
        firmware: '2-main',
        grep: /^(?=.*@T3B1)(?=.*@webOnly)/,
        additionalGrepInvert: /@specificFirmware/,
        currentsTags: tagsCanary,
    },
    {
        model: Model.T2T1,
        nameSuffix: 'fw_canary',
        firmware: '2-main',
        grep: /^(?=.*@T2T1)(?=.*@webOnly)/,
        additionalGrepInvert: /@specificFirmware/,
        currentsTags: tagsCanary,
    },
    {
        model: Model.T1B1,
        nameSuffix: 'fw_canary',
        firmware: '1-main',
        grep: /^(?=.*@T1B1)(?=.*@webOnly)/,
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
