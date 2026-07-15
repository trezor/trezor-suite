import { ElectronApplication, Page, _electron as electron } from '@playwright/test';
import { createWriteStream, ensureDirSync } from 'fs-extra';
import path from 'path';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { BRIDGE_VERSION } from './bridge';

const appDir = path.join(__dirname, '../../../packages/suite-desktop');
const showConnectLogsArgument = '--state.suite.settings.debug.showConnectLogs=true';
// #15670 Bug in desktop app that loglevel is ignored
const logLevelArgument = `--log-level=${process.env.LOGLEVEL ?? 'debug'}`;
const disableHWAccelerationArgument = '--disable-gpu'; // to fix chromium error GetVSyncParametersIfAvailable()
const removeUserDataArgument = '--remove-user-data-on-start';
const exposeStoreArgument = '--expose-store';

export type LaunchSuiteParams = {
    keepUserData?: boolean;
    bridgeDaemon?: boolean;
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

const buildArgs = (params: LaunchSuiteParams) => {
    const args = [
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
        args.push('--bridge-daemon-show-ui');
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

    const electronApp = await electron.launch({
        cwd: appDir,
        args: buildArgs(params),
        env: {
            ...process.env,
            PLAYWRIGHT_RUN: 'true',
        },
        colorScheme: params.colorScheme,
        locale: params.locale,
        recordVideo: { dir: params.artefactFolder, size: params.viewport },
    });

    setupLoggingToFile(electronApp, params);

    return electronApp;
};

export const launchSuite = async (params: LaunchSuiteParams): Promise<Suite> => {
    const electronApp = await launchSuiteElectronApp(params);
    const window = await electronApp.firstWindow();

    return { electronApp, window };
};
