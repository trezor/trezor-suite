import { defineConfig } from '@playwright/test';

import { baseConfig } from './playwright-base.config';
import {
    PlaywrightProjectBuilder,
    PlaywrightProjectDefinition,
} from './playwright-project-builder';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

const target = PlaywrightTarget.Web;
const definition: PlaywrightProjectDefinition[] = [{ name: 'manual', grep: /@group=manual/ }];

const config = defineConfig({
    ...baseConfig,
    projects: PlaywrightProjectBuilder.buildFromDefinitions(target, definition),
});

/* eslint-disable-next-line import/no-default-export */
export default config;
