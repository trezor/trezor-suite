import { PlaywrightTestOptions, PlaywrightWorkerOptions, defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsNightly } from './projectTags';
import { PlaywrightTarget, SuiteTestOptions } from '../support/testExtends/suiteTestOptions';

/*
 * Desktop Nightly config
 * This config is used to run tests once a day against the latest desktop application build (nightly).
 * There are projects for all supported device models with the latest firmware version.
 */
const target = PlaywrightTarget.Desktop;
const definition: PlaywrightProjectDefinition[] = [
    { model: Model.T3W1, currentsTags: tagsNightly },
    { model: Model.T3T1, currentsTags: tagsNightly },
    { model: Model.T3B1, currentsTags: tagsNightly },
    { model: Model.T2T1, currentsTags: tagsNightly },
    { model: Model.T1B1, currentsTags: tagsNightly },
    { name: 'no_device', currentsTags: tagsNightly, grep: /^(?=.*@noDevice)/ },
];

const config = defineConfig<SuiteTestOptions & PlaywrightTestOptions, PlaywrightWorkerOptions>({
    ...baseConfig,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
});

/* eslint-disable-next-line import/no-default-export */
export default config;
