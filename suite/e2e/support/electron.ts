import { ElectronApplication, Page, _electron as electron } from '@playwright/test';
import { createWriteStream, ensureDirSync } from 'fs-extra';
import path from 'path';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { BRIDGE_VERSION } from './bridge';
import { getLighthouseDebugPort, isLighthouseEnabled } from '../performance/lighthouseConfig';

const appDir = path.join(__dirname, '../../../suite/desktop-app');
const showConnectLogsArgument = '--state.suite.settings.debug.showConnectLogs=true';
// #15670 Bug in desktop app that loglevel is ignored
const logLevelArgument = `--log-level=${process.env.LOGLEVEL ?? 'debug'}`;
const disableHWAccelerationArgument = '--disable-gpu'; // to fix chromium error GetVSyncParametersIfAvailable()
const removeUserDataArgument = '--remove-user-data-on-start';
const exposeStoreArgument = '--expose-store';

export type LaunchSuiteParams = {
    keepUserData?: boolean;
    bridgeDaemon?: 'with-ui' | 'without-ui';
    exposeConnectWs?: boolean;
    offlineMode?: boolean;
    locale?: string;
    colorScheme?: 'light' | 'dark' | 'no-preference' | null | undefined;
    artefactFolder: string;
    viewport: { width: number; height: number };
    disableAuthenticityCheck?: boolean;
};

export type Suite = {
    electronApp: ElectronApplication;
    window: Page;
};

const formatErrorLogMessage = (data: string) => {
    const red = '\x1b[31m';
    const reset = '\x1b[0m';
    const bold = '\x1b[1m';
    const unbold = '\x1b[22m';
    const timestamp = new Date().toISOString();

    return `${timestamp} - ${bold}${red}ERROR${unbold}: ${data}${reset}`;
};

/**
 * Whether this worker's debugging endpoint is currently held by a running app.
 *
 * A worker gets one port, but a test may run a second app beside the one its fixtures gave it — the
 * bridge tests launch their own. Two processes cannot listen on one port, and the loser starts
 * without a working endpoint, which is how it first showed up: the two tests that launch a second
 * app were the two that timed out. So the port goes to the app that is running alone, and anything
 * launched beside it runs unprofiled rather than fighting over it. That is the right way round —
 * the app the fixtures provide is the one `perf.measure` measures.
 */
let debugPortHeld = false;

const takeDebugPort = (): number | null => {
    if (!isLighthouseEnabled() || debugPortHeld) {
        return null;
    }
    debugPortHeld = true;

    return getLighthouseDebugPort();
};

const buildArgs = (params: LaunchSuiteParams, debugPort: number | null) => {
    const args = [
        // Lighthouse attaches to the renderer through Puppeteer, which needs a CDP endpoint of its
        // own. The switch goes ahead of the app path: Electron takes the first argument that is not
        // a switch as the app to run, and hands only what precedes it to Chromium.
        ...(debugPort === null ? [] : [`--remote-debugging-port=${debugPort}`]),

        // This needs to be just path to the app root, so it is same as for production builds,
        // electron will resolve the path to app.js from the package.json => "main": "dist/app.js",
        appDir,

        exposeStoreArgument,
        `--width=${params.viewport.width}`,
        `--height=${params.viewport.height}`,
        logLevelArgument,
        disableHWAccelerationArgument,
        showConnectLogsArgument,
    ];

    if (params.bridgeDaemon) {
        args.push(
            params.bridgeDaemon === 'with-ui' ? '--bridge-daemon-show-ui' : '--bridge-daemon',
        );
    }

    if (params.exposeConnectWs) {
        args.push('--expose-connect-ws');
    }

    if (params.offlineMode) {
        args.push('--offline-mode');
    }

    const deleteUserData = !params.keepUserData;
    if (deleteUserData) {
        args.push(removeUserDataArgument);
    }

    return args;
};

const setupLoggingToFile = (electronApp: ElectronApplication, params: LaunchSuiteParams) => {
    const logFilePath = path.join(params.artefactFolder, 'electron-logs.txt');
    ensureDirSync(params.artefactFolder);
    const logStream = createWriteStream(logFilePath, { flags: 'a' });

    electronApp.process().stdout?.on('data', data => logStream.write(data.toString()));
    electronApp
        .process()
        .stderr?.on('data', data => logStream.write(formatErrorLogMessage(data.toString())));
    electronApp.process().on('close', () => {
        logStream.end();
    });
};

export const launchSuiteElectronApp = async (params: LaunchSuiteParams) => {
    if (!params.bridgeDaemon) {
        await TrezorUserEnvLink.startBridge(BRIDGE_VERSION);
    }

    const debugPort = takeDebugPort();

    const release = () => {
        if (debugPort !== null) {
            debugPortHeld = false;
        }
    };

    let electronApp;
    try {
        electronApp = await electron.launch({
            cwd: appDir,
            args: buildArgs(params, debugPort),
            env: {
                ...process.env,
                PLAYWRIGHT_RUN: 'true',
            },
            colorScheme: params.colorScheme,
            locale: params.locale,
            recordVideo: { dir: params.artefactFolder, size: params.viewport },
        });
    } catch (error) {
        // An app that never started is not holding anything; the next launch may have the port.
        release();
        throw error;
    }

    electronApp.process().on('close', release);

    setupLoggingToFile(electronApp, params);

    return electronApp;
};

export const launchSuite = async (params: LaunchSuiteParams): Promise<Suite> => {
    const electronApp = await launchSuiteElectronApp(params);
    const window = await electronApp.firstWindow();

    return { electronApp, window };
};
