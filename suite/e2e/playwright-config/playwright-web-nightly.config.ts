import { defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import { tagsCanary, tagsNightly } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';
const target = PlaywrightTarget.Web;

/*
 * Web Nightly config
 * This config is used to run tests once a day against the latest web application build (nightly).
 * There are projects for all supported device models with the latest and main (canary) firmware versions
 * With the canary FW, we only run smoke tests on T3T1 model and tests tagged as @webOnly to reduce the total number of tests executed
 */
const config = defineConfig({
    ...baseConfig,
    projects: [
        new PlaywrightProjectBuilder(target, Model.T3W1).setCurrentsTags(tagsNightly).build(),
        new PlaywrightProjectBuilder(target, Model.T3T1).setCurrentsTags(tagsNightly).build(),
        new PlaywrightProjectBuilder(target, Model.T3B1).setCurrentsTags(tagsNightly).build(),
        new PlaywrightProjectBuilder(target, Model.T2T1).setCurrentsTags(tagsNightly).build(),
        new PlaywrightProjectBuilder(target, Model.T1B1).setCurrentsTags(tagsNightly).build(),
        new PlaywrightProjectBuilder(target, 'no_device')
            .addGrep(/(?=.*@noDevice)/)
            .setCurrentsTags(tagsNightly)
            .build(),
        // FW Canary projects
        new PlaywrightProjectBuilder(target, Model.T3W1, 'fw_canary')
            .setFirmwareVersion('2-main')
            .setGrep(/(?=.*@T3W1)(?=.*@webOnly)/)
            .addGrepInvert(/@specificFirmware/)
            .setCurrentsTags(tagsCanary)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T3T1, 'fw_canary')
            .setFirmwareVersion('2-main')
            .setGrep(/(?=.*@T3T1)(?=.*@smoke)(?=.*@webOnly)/)
            .addGrepInvert(/@specificFirmware/)
            .setCurrentsTags(tagsCanary)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T3B1, 'fw_canary')
            .setFirmwareVersion('2-main')
            .setGrep(/(?=.*@T3B1)(?=.*@webOnly)/)
            .addGrepInvert(/@specificFirmware/)
            .setCurrentsTags(tagsCanary)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T2T1, 'fw_canary')
            .setFirmwareVersion('2-main')
            .setGrep(/(?=.*@T2T1)(?=.*@webOnly)/)
            .addGrepInvert(/@specificFirmware/)
            .setCurrentsTags(tagsCanary)
            .build(),
        new PlaywrightProjectBuilder(target, Model.T1B1, 'fw_canary')
            .setFirmwareVersion('1-main')
            .setGrep(/(?=.*@T1B1)(?=.*@webOnly)/)
            .addGrepInvert(/@specificFirmware/)
            .setCurrentsTags(tagsCanary)
            .build(),
    ],
});

/* eslint-disable-next-line import/no-default-export */
export default config;
