import { PlaywrightTestOptions, PlaywrightWorkerOptions, defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { PlaywrightTarget, SuiteTestOptions } from '../support/testExtends/suiteTestOptions';

/*
 * Web local canary config
 * This config is used to run tests locally with main (canary) firmware version
 * There are projects for all supported device models with the main (canary) firmware version
 */
const target = PlaywrightTarget.Web;
const definition: PlaywrightProjectDefinition[] = [
    {
        model: Model.T3W1,
        nameSuffix: 'fw_canary',
        firmware: '2-main',
        additionalGrepInvert: /@specificFirmware/,
    },
    {
        model: Model.T3T1,
        nameSuffix: 'fw_canary',
        firmware: '2-main',
        additionalGrepInvert: /@specificFirmware/,
    },
    {
        model: Model.T3B1,
        nameSuffix: 'fw_canary',
        firmware: '2-main',
        additionalGrepInvert: /@specificFirmware/,
    },
    {
        model: Model.T2T1,
        nameSuffix: 'fw_canary',
        firmware: '2-main',
        additionalGrepInvert: /@specificFirmware/,
    },
    {
        model: Model.T1B1,
        nameSuffix: 'fw_canary',
        firmware: '1-main',
        additionalGrepInvert: /@specificFirmware/,
    },
];

const config = defineConfig<SuiteTestOptions & PlaywrightTestOptions, PlaywrightWorkerOptions>({
    ...baseConfig,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
});

/* eslint-disable-next-line import/no-default-export */
export default config;
