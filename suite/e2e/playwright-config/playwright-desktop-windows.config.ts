import { defineConfig } from '@playwright/test';

import { noOtherDevice } from '@trezor/e2e-utils';
import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsWindows } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

/*
 * Desktop Windows config
 * Runs the @windows subset on a Windows runner: tests exercising the Electron main process or OS integration.
 * T3W1 runs the shared set, T3T1 only its exclusive tests, no_device the device-less ones.
 */
const target = PlaywrightTarget.Desktop;
const windowsOnly = '(?=.*@windows)';
const definition: PlaywrightProjectDefinition[] = [
    {
        model: Model.T3W1,
        currentsTags: tagsWindows,
        grep: new RegExp(`^(?=.*@T3W1)${windowsOnly}`),
    },
    {
        model: Model.T3T1,
        currentsTags: tagsWindows,
        grep: new RegExp(`^(?=.*@T3T1)${windowsOnly}${noOtherDevice()}`),
    },
    {
        name: 'no_device',
        currentsTags: tagsWindows,
        grep: new RegExp(`^(?=.*@noDevice)${windowsOnly}`),
    },
];

const config = defineConfig({
    ...baseConfig,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
});

/* eslint-disable-next-line import/no-default-export */
export default config;
