/* eslint-disable import/no-extraneous-dependencies, import/no-default-export */
/**
 * Currents configuration for the seed seeder, consumed by the `pwc` CLI.
 *
 * Usage:
 *   pwc --config seed/playwright.config.ts
 *   (pwc resolves currents.config.ts from the cwd or via --pwc-config flag)
 *
 * Required env vars:
 *   CURRENTS_RECORD_KEY   – your Currents record key
 *
 * Optional env vars:
 *   CURRENTS_CI_BUILD_ID  – custom build ID (defaults to seed-<timestamp>)
 *   CURRENTS_TAG          – comma-separated tags to attach to the run
 */

import type { CurrentsConfig } from '@currents/playwright';

export default {
    recordKey: process.env.CURRENTS_RECORD_KEY!,
    projectId: 'iBEsWE', // Experimental Playground
    ciBuildId: process.env.CURRENTS_CI_BUILD_ID ?? `seed-${Date.now()}`,
    tag: process.env.CURRENTS_TAG?.split(',').filter(Boolean) ?? ['seed'],
} satisfies CurrentsConfig;
