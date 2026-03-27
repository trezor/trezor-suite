import { defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsRelease } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

/*
 * Web general config
 * This config is used to run tests locally as well as in release testing
 * There are projects for all supported device models with the latest firmware version
 */
const target = PlaywrightTarget.Web;
const definition: PlaywrightProjectDefinition[] = [
    { model: Model.T3W1, currentsTags: tagsRelease },
    { model: Model.T3T1, currentsTags: tagsRelease },
    { model: Model.T3B1, currentsTags: tagsRelease },
    { model: Model.T2T1, currentsTags: tagsRelease },
    { model: Model.T1B1, currentsTags: tagsRelease },
    { name: 'no_device', currentsTags: tagsRelease, grep: /^(?=.*@noDevice)/ },
];

const config = defineConfig({
    ...baseConfig,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
});

/* eslint-disable-next-line import/no-default-export */
export default config;
