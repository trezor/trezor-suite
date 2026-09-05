import { defineConfig, devices } from '@playwright/test';

import { GALLERY_URL } from './galleryServer';

/**
 * Two ways to serve the story gallery:
 *
 * - `COMPONENT_TESTS_DEV=1` runs the Vite dev server, so story edits hot-reload. Every `mount()`
 *   navigates, and in dev mode that refetches the whole unbundled module graph — ~6k requests and
 *   ~10s for a story that pulls in the Suite store. Use it while writing stories.
 * - The default serves a prebuilt bundle: ~20 requests and well under a second per mount. Rebuild
 *   with `yarn build:gallery` whenever stories change, or a stale bundle reports "Unknown story".
 */
const isDevServer = process.env.COMPONENT_TESTS_DEV === '1';
const isCI = !!process.env.GITHUB_ACTION;

/* eslint-disable-next-line import/no-default-export */
export default defineConfig({
    testDir: './tests',
    // Stories own their state, so nothing is shared between tests and they can run in parallel.
    fullyParallel: true,
    retries: isCI ? 1 : 0,
    forbidOnly: isCI,
    timeout: 30_000,
    expect: { timeout: 5_000 },
    reporter: [['list'], ['html', { open: 'never' }]],
    projects: [
        {
            name: 'components',
            use: {
                ...devices['Desktop Chrome'],
                channel: 'chromium',
                baseURL: GALLERY_URL,
                testIdAttribute: 'data-testid',
                // Keep the app's service worker from serving cached responses that would shadow
                // `page.route()` mocks.
                serviceWorkers: 'block',
                reuseContext: true,
                trace: 'on',
            },
        },
    ],
    webServer: {
        command: isDevServer
            ? 'yarn vite --config vite.config.mts'
            : 'yarn vite preview --config vite.config.mts',
        url: GALLERY_URL,
        reuseExistingServer: !isCI,
        stdout: 'pipe',
        stderr: 'pipe',
        timeout: 120_000,
    },
});
