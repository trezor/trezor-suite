import { BrowserContext, TestInfo, test } from '@playwright/test';
import { execSync } from 'child_process';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { BRIDGE_VERSION } from './bridge';
import { getVideoPath, mockRemoteMessageSystem } from './common';
import { Suite, launchSuite } from './electron';
import { ElectronConf } from './testExtends/suiteBaseFixture';

export const electronSetup = async (
    testInfo: TestInfo,
    locale: string | undefined,
    colorScheme: any,
    electronConf: ElectronConf,
) => {
    const suite = await launchSuite({
        locale,
        colorScheme,
        artefactFolder: testInfo.outputDir,
        viewport: testInfo.project.use.viewport!,
        ...electronConf,
    });

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
    const tracePath = `${testInfo.outputDir}/trace.electron.zip`;
    await suite.window.context().tracing.stop({ path: tracePath });
    testInfo.attachments.push({
        name: 'electron-logs.txt',
        path: `${testInfo.outputDir}/electron-logs.txt`,
        contentType: 'text/plain',
    });
    testInfo.attachments.push({
        name: 'trace',
        path: tracePath,
        contentType: 'application/zip',
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
        await suite.window.getByTestId('@auto-start-before-quit/button-quit').click();
    }
    await closePromise;
};
export const webSetup = async (browserContext: BrowserContext) => {
    await TrezorUserEnvLink.startBridge(BRIDGE_VERSION);

    // Need to allow this to be able to access bridge on localhost
    // When running tests against suite deployed elsewhere
    if (browserContext.browser()?.browserType().name() === 'chromium') {
        await browserContext.grantPermissions(['local-network-access']);
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
            }, 30000)),
    );

    const promiseWithClearingTimeout = async () => {
        await promise;
        clearTimeout(timeoutId);
    };

    await Promise.race([promiseWithClearingTimeout(), timeoutPromise]);
};

export const cleanupTrezorUserEnv = async (testInfo: TestInfo) => {
    const setupPromise = (async () => {
        await TrezorUserEnvLink.logTestDetails(
            ` - - - EXECUTING TENV CLEANUP FOR TEST ${testInfo.titlePath.join(' - ')}`,
        );
        await TrezorUserEnvLink.stopBridge();
        await TrezorUserEnvLink.stopEmu();
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.logTestDetails(
            ` - - - TENV CLEANUP COMPLETED FOR TEST ${testInfo.titlePath.join(' - ')}`,
        );
    })();

    await test.step('Device environment cleanup', async () => {
        await trezorUserEnvStuckProtection(setupPromise);
    });
};

export const wipeAndRestartEvoluServer = async () => {
    await test.step('Wipe Evolu Relay data', () => {
        execSync(
            'docker compose -f docker/docker-compose.suite-ci-e2e.yml exec -T suite-sync rm -rf /app/data',
            {
                cwd: '../../',
            },
        );
    });

    await test.step('Restart Evolu Relay server', () => {
        execSync(
            'docker compose -f docker/docker-compose.suite-ci-e2e.yml restart quota-db suite-sync',
            {
                cwd: '../../',
            },
        );
    });
};
