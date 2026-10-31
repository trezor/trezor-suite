import { defineConfig } from '@playwright/test';

import {
    excludedFromFullPrRun,
    notWebOnlyUnlessEdited,
    sharedWithOtherModelUnlessEdited,
} from '@trezor/e2e-utils';
import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsPr } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

/*
 * Web PR config
 * This config is used to run tests on each PR
 * There are projects for all supported device models with the latest firmware version
 * To save Currents quota, T3W1 acts as the representative flagship and runs the full set; T3T1 runs only
 * its exclusive (T3T1-only) tests on PR. Shared T3W1/T3T1 tests get full T3T1 coverage in nightly instead.
 * Only @webOnly tests run on web.
 * @skipOnPR tests are excluded, and so are @optional tests unless the PR edits their file.
 * Test files the PR edits run on every tagged model and without the @webOnly limit, as in a spec-list run.
 * Spec-list runs use playwright-web-pr-all.config.ts.
 */
const target = PlaywrightTarget.Web;
const excludedFromWebPrRun = (): RegExp[] => [...excludedFromFullPrRun(), notWebOnlyUnlessEdited()];
const definition: PlaywrightProjectDefinition[] = [
    { model: Model.T3W1, additionalGrepInvert: excludedFromWebPrRun(), currentsTags: tagsPr },
    {
        model: Model.T3T1,
        additionalGrepInvert: [...excludedFromWebPrRun(), sharedWithOtherModelUnlessEdited()],
        currentsTags: tagsPr,
    },
    { model: Model.T3B1, additionalGrepInvert: excludedFromWebPrRun(), currentsTags: tagsPr },
    { model: Model.T2T1, additionalGrepInvert: excludedFromWebPrRun(), currentsTags: tagsPr },
    { model: Model.T1B1, additionalGrepInvert: excludedFromWebPrRun(), currentsTags: tagsPr },
    {
        name: 'no_device',
        additionalGrepInvert: excludedFromWebPrRun(),
        currentsTags: tagsPr,
        grep: /^(?=.*@noDevice)/,
    },
];

const config = defineConfig({
    ...baseConfig,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
});

/* eslint-disable-next-line import/no-default-export */
export default config;
