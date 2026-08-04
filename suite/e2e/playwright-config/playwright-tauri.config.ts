import { defineConfig } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

import { baseConfig } from './playwright-base.config';
import { PlaywrightProjectBuilder } from './playwright-project-builder';
import type { PlaywrightProjectDefinition } from './playwright-project-builder';
import { tagsRelease } from './projectTags';
import { PlaywrightTarget } from '../support/testExtends/suiteTestOptions';

/*
 * Tauri general config.
 * Runs the desktop-mode frontend served on :8000 in Chromium, with a JS-injected window.desktopApi
 * mirroring the Tauri Rust backend (macOS WKWebView cannot be WebDriver-driven). Mirrors the web
 * config's device-model matrix.
 */
const target = PlaywrightTarget.Tauri;
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
