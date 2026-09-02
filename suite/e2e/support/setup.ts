import { BrowserContext, TestInfo, expect } from '@playwright/test';
import { execSync } from 'child_process';

import { installPerfInstrumentation } from '@trezor/perf-e2e';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { BRIDGE_VERSION } from './bridge';
import { getVideoPath, mockRemoteMessageSystem } from './common';
import { Suite, launchSuite } from './electron';
import { ElectronConf } from './types';

export const electronSetup = async (
    testInfo: TestInfo,
    locale: string | undefined,
    colorScheme: any,
    electronConf: ElectronConf,
) => {
    // Activate the test-runner's TestTracing so test.step(), beforeEach, and
    // fixture events are recorded. Config-level trace: 'off' suppresses this by
    // default for Electron projects (playwright#13180 workaround).
    await (testInfo as any)._tracing.startIfNeeded('on');

    const suite = await launchSuite({
        locale,
        colorScheme,
        artefactFolder: testInfo.outputDir,
        viewport: testInfo.project.use.viewport!,
        ...electronConf,
    });

    // The reload puts the init script in place before the renderer's React loads; the window is
    // still on its initial screen, so no state is lost. Passive until a test opts in. PERF=0 skips it.
    if (process.env.PERF !== '0') {
        await suite.window.addInitScript(installPerfInstrumentation);
        await suite.window.reload();
    }

    // Mocks shell.openExternal to prevent opening real browser windows.
    await suite.electronApp.evaluate(({ shell }) => {
        shell.openExternal = (url: string) => {
            console.warn(`[mock] shell.openExternal called with: ${url}`);

            return Promise.resolve(); // satisfies the 'async' requirement implicitly
        };
    });

    await suite.window
        .context()
        .tracing.start({ screenshots: true, snapshots: true, sources: true });
    // this setting only takes effect for the renderer process. To emulate offline mode also in the main process, a custom runtime flag is used.
    await suite.electronApp.context().setOffline(electronConf.offlineMode ?? false);

    await mockRemoteMessageSystem(suite.window);

    return suite;
};

export const electronTeardown = async (
    suite: Suite,
    testInfo: TestInfo,
    electronConf: ElectronConf,
) => {
    // Save the CDP context trace to a path registered in TestTracing._temporaryTraceFiles.
    // TestTracing.stopIfNeeded() (called automatically by Playwright) will merge it with
    // the test-runner step trace (test.trace) into a single trace.zip attachment.
    const tracingPath =
        (testInfo as any)._tracing.maybeGenerateNextTraceRecordingPath() ??
        `${testInfo.outputDir}/trace.electron.zip`;
    if (!suite.window.isClosed()) {
        await suite.window.context().tracing.stop({ path: tracingPath });
    }
    testInfo.attachments.push({
        name: 'electron-logs.txt',
        path: `${testInfo.outputDir}/electron-logs.txt`,
        contentType: 'text/plain',
    });
    const videoPath = getVideoPath(testInfo.outputDir);
    if (videoPath) {
        testInfo.attachments.push({
            name: 'video',
            path: videoPath,
            contentType: 'video/webm',
        });
    }
    const closePromise = suite.electronApp.close();
    // Handle modal that asks to enable auto-start
    if (electronConf.exposeConnectWs) {
        const autoStartQuitButton = suite.window.getByTestId('@auto-start-before-quit/button-quit');
        await expect(
            autoStartQuitButton,
            'expected the AutoStart Quit button to be enabled',
        ).toBeEnabled();
        await autoStartQuitButton.click();
    }
    await closePromise;
};

export const webSetup = async (
    browserContext: BrowserContext,
    { webClipboardRead }: { webClipboardRead: boolean },
) => {
    await TrezorUserEnvLink.startBridge(BRIDGE_VERSION);

    if (browserContext.browser()?.browserType().name() === 'chromium') {
        await browserContext.grantPermissions([
            // Need to allow this to be able to access bridge on localhost
            // When running tests against suite deployed elsewhere
            'local-network-access',
            // Need to allow this to be able to read and write to the clipboard
            ...(webClipboardRead ? (['clipboard-read', 'clipboard-write'] as const) : []),
        ]);
    }

    if (webClipboardRead) {
        // Deployed Suite sends Permissions-Policy: clipboard-read=(), which the granted
        // permission cannot override, so relax the header for this browser context only.
        await browserContext.route('**/*', async route => {
            if (route.request().resourceType() !== 'document') {
                return route.fallback();
            }
            const response = await route.fetch();
            const headers = { ...response.headers() };
            const policy = headers['permissions-policy'];
            if (policy?.includes('clipboard-read')) {
                const clipboardDirective = /clipboard-read=\([^)]*\)/;
                if (!clipboardDirective.test(policy)) {
                    throw new Error(
                        `Cannot rewrite clipboard-read in the Permissions-Policy header, its format changed: ${policy}`,
                    );
                }
                headers['permissions-policy'] = policy.replace(
                    clipboardDirective,
                    'clipboard-read=(self)',
                );
            }
            await route.fulfill({ response, headers });
        });
    }

    const page = await browserContext.newPage();

    // Tells the app to attach Redux Store to window object. packages/suite-web/src/support/usePlaywright.ts
    // Which is needed for methods manupalating Redux store like onboardingPage.disableFirmwareHashCheck
    await page.context().addInitScript(() => {
        window.Playwright = true;
    });
    await page.goto('./');
    await mockRemoteMessageSystem(page);

    return page;
};

// Gives trezorUserEnv promise a 30s to complete, else restart tenv to recover from potential hangs
export const trezorUserEnvStuckProtection = async (promise: Promise<any>) => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise(
        (_, reject) =>
            (timeoutId = setTimeout(() => {
                if (process.env.COMPOSE_FILE) {
                    execSync('docker compose restart trezor-user-env-unix', { cwd: '../../' }); // restart tenv to fix potential hangs
                }
                reject(new Error('TrezorUserEnv action timed out'));
            }, 30_000)),
    );

    const promiseWithClearingTimeout = async () => {
        await promise;
        clearTimeout(timeoutId);
    };

    await Promise.race([promiseWithClearingTimeout(), timeoutPromise]);
};
