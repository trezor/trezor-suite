import { defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsPr } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

/*
 * Desktop PR All config
 * This config is used when a spec list scopes the PR run (LLM test selector or edited test files).
 * Unlike playwright-desktop-pr.config.ts, T3T1 runs its full set and @optional tests are
 * included — the spec list itself scopes the run. @nightlyOnly tests must never run on a PR.
 */
const target = PlaywrightTarget.Desktop;
const definition: PlaywrightProjectDefinition[] = [
    { model: Model.T3W1, additionalGrepInvert: /@nightlyOnly/, currentsTags: tagsPr },
    { model: Model.T3T1, additionalGrepInvert: /@nightlyOnly/, currentsTags: tagsPr },
    { model: Model.T3B1, additionalGrepInvert: /@nightlyOnly/, currentsTags: tagsPr },
    { model: Model.T2T1, additionalGrepInvert: /@nightlyOnly/, currentsTags: tagsPr },
    { model: Model.T1B1, additionalGrepInvert: /@nightlyOnly/, currentsTags: tagsPr },
    {
        name: 'no_device',
        additionalGrepInvert: /@nightlyOnly/,
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
