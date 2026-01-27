import { PlaywrightTestOptions, PlaywrightWorkerOptions, defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import { PlaywrightTarget, SuiteTestOptions } from '../support/testExtends/suiteTestOptions';

const target = PlaywrightTarget.Web;

/*
 * Web local canary config
 * This config is used to run tests locally with main (canary) firmware version
 * There are projects for all supported device models with the main (canary) firmware version
 */
const config = defineConfig<SuiteTestOptions & PlaywrightTestOptions, PlaywrightWorkerOptions>({
    ...baseConfig,
    projects: [
        new PlaywrightProjectBuilder(target, Model.T3W1, 'fw_canary')
            .setFirmwareVersion('2-main')
            .addGrepInvert(/@specificFirmware/)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T3T1, 'fw_canary')
            .setFirmwareVersion('2-main')
            .addGrepInvert(/@specificFirmware/)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T3B1, 'fw_canary')
            .setFirmwareVersion('2-main')
            .addGrepInvert(/@specificFirmware/)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T2T1, 'fw_canary')
            .setFirmwareVersion('2-main')
            .addGrepInvert(/@specificFirmware/)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T1B1, 'fw_canary')
            .setFirmwareVersion('1-main')
            .addGrepInvert(/@specificFirmware/)
            .build(),
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
