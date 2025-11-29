import { ElectronApplication, Page, _electron as electron } from '@playwright/test';
import { createWriteStream, ensureDirSync } from 'fs-extra';
import path from 'path';

import { StartEmu, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { BRIDGE_VERSION } from './bridge';
import { getModelFromEnv } from './helpers/modelFromEnv';

const appDir = path.join(__dirname, '../../../suite-desktop');
const disableHashChecksPatch = '--state.suite.settings.enabledSecurityChecks.firmwareHash=false';
const disableFirmwareRevisionChecksPatch =
    '--state.suite.settings.enabledSecurityChecks.firmwareRevision=false';
const disableAuthenticityCheckPatch =
    '--state.suite.settings.enabledSecurityChecks.deviceAuthenticity=false';
const showDebugMenuStatePatch = '--state.suite.settings.debug.showDebugMenu=true';
const disableDisconnectPromptPatch = '--state.suite.flags.hasSeenDisconnectTooltip=true';
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

const buildArgs = (params: LaunchSuiteParams, emulatorStartConf: StartEmu) => {
    const args = [
        // This needs to be just path to the app root, so it is same as for production builds,
        // electron will resolve the path to app.js from the package.json => "main": "dist/app.js",
        appDir,

        exposeStoreArgument,
        `--width=${params.viewport.width}`,
        `--height=${params.viewport.height}`,
        logLevelArgument,
        disableHWAccelerationArgument,
        disableHashChecksPatch,
        showDebugMenuStatePatch,
        disableDisconnectPromptPatch,
        showConnectLogsArgument,
    ];

    if (params.bridgeDaemon) {
        args.push('--bridge-daemon-show-ui');
    } else {
        args.push('--bridge-legacy', '--bridge-test');
    }

    if (params.exposeConnectWs) {
        args.push('--expose-connect-ws');
    }

    const deleteUserData = !params.keepUserData;
    if (deleteUserData) {
        args.push(removeUserDataArgument);
    }

    if (emulatorStartConf.version?.endsWith('-main')) {
        args.push(disableFirmwareRevisionChecksPatch);
    }

    if (getModelFromEnv() === 'T3W1' || params.disableAuthenticityCheck) {
        args.push(disableAuthenticityCheckPatch);
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

export const launchSuiteElectronApp = async (
    params: LaunchSuiteParams,
    emulatorStartConf: StartEmu,
) => {
    if (!params.bridgeDaemon) {
        await TrezorUserEnvLink.startBridge(BRIDGE_VERSION);
    }

    const electronApp = await electron.launch({
        cwd: appDir,
        args: buildArgs(params, emulatorStartConf),
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

export const launchSuite = async (
    params: LaunchSuiteParams,
    emulatorStartConf: StartEmu,
): Promise<Suite> => {
    const electronApp = await launchSuiteElectronApp(params, emulatorStartConf);
    const window = await electronApp.firstWindow();

    return { electronApp, window };
};
