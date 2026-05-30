import * as http from 'http';

import { BrowserContext, TestInfo } from '@playwright/test';
import { execSync } from 'child_process';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { BRIDGE_VERSION, BRIDGE_URL } from './bridge';
import { getVideoPath, mockRemoteMessageSystem } from './common';
import { Suite, launchSuite } from './electron';
import { ElectronConf } from './types';

// Compatibility relay for older Suite versions (e.g. 22.5, 25.7) that connect to the
// legacy Go-bridge port 21325. The node-bridge now runs only on 21328 so requests to
// 21325 are proxied across.  We also inject the Private-Network-Access response header
// so Chrome's PNA enforcement does not block the cross-origin requests from
// dev.suite.sldev.cz.
const LEGACY_BRIDGE_PORT = 21325;
let compatibilityRelay: http.Server | null = null;

const startCompatibilityBridgeRelay = () =>
    new Promise<void>(resolve => {
        if (compatibilityRelay?.listening) {
            resolve();

            return;
        }

        const relay = http.createServer((req, res) => {
            // Handle CORS pre-flight (including Chrome Private Network Access pre-flights).
            if (req.method === 'OPTIONS') {
                if (req.headers.origin) {
                    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
                }
                res.setHeader('Access-Control-Allow-Private-Network', 'true');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                res.setHeader(
                    'Access-Control-Allow-Headers',
                    req.headers['access-control-request-headers'] ?? '',
                );
                res.statusCode = 200;
                res.end();

                return;
            }

            const bridgePort = Number(new URL(BRIDGE_URL).port);
            const proxyReq = http.request(
                {
                    hostname: '127.0.0.1',
                    port: bridgePort,
                    path: req.url,
                    method: req.method,
                    headers: { ...req.headers, host: `127.0.0.1:${bridgePort}` },
                },
                proxyRes => {
                    const responseHeaders: http.OutgoingHttpHeaders = { ...proxyRes.headers };
                    if (req.headers.origin) {
                        responseHeaders['access-control-allow-origin'] = req.headers.origin;
                    }
                    responseHeaders['access-control-allow-private-network'] = 'true';
                    res.writeHead(proxyRes.statusCode!, responseHeaders);
                    proxyRes.pipe(res, { end: true });
                },
            );

            req.pipe(proxyReq, { end: true });
            proxyReq.on('error', () => {
                res.statusCode = 502;
                res.end();
            });
        });

        relay.listen(LEGACY_BRIDGE_PORT, '127.0.0.1', () => {
            compatibilityRelay = relay;
            resolve();
        });

        relay.on('error', (err: NodeJS.ErrnoException) => {
            // Port already in use — another process has the relay; that's acceptable.
            if (err.code === 'EADDRINUSE') {
                resolve();
            }
        });
    });

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
        await suite.window.getByTestId('@auto-start-before-quit/button-quit').click();
    }
    await closePromise;
};

export const webSetup = async (browserContext: BrowserContext) => {
    await TrezorUserEnvLink.startBridge(BRIDGE_VERSION);
    await startCompatibilityBridgeRelay();

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
            }, 30_000)),
    );

    const promiseWithClearingTimeout = async () => {
        await promise;
        clearTimeout(timeoutId);
    };

    await Promise.race([promiseWithClearingTimeout(), timeoutPromise]);
};
