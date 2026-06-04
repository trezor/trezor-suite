import { defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsPr } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

/*
 * Web PR All config
 * This config is used when the LLM test selector provides a specific spec list.
 * Unlike playwright-web-pr.config.ts, tests are not filtered to @webOnly — the spec list
 * itself scopes the run, so all device models run their full test set.
 */
const target = PlaywrightTarget.Web;
const definition: PlaywrightProjectDefinition[] = [
    { model: Model.T3W1, currentsTags: tagsPr },
    { model: Model.T3T1, currentsTags: tagsPr },
    { model: Model.T3B1, currentsTags: tagsPr },
    { model: Model.T2T1, currentsTags: tagsPr },
    { model: Model.T1B1, currentsTags: tagsPr },
    {
        name: 'no_device',
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
