import { ElectronApplication, Page, _electron as electron } from '@playwright/test';
import { createWriteStream, ensureDirSync } from 'fs-extra';
import path from 'path';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

// specific version of legacy bridge is requested & expected
export const LEGACY_BRIDGE_VERSION = '2.0.33';

const appDir = path.join(__dirname, '../../../suite-desktop');
const disableHashChecksPatch = '--state.suite.settings.enabledSecurityChecks.firmwareHash=false';
const disableFirmwareRevisionChecksPatch =
    '--state.suite.settings.enabledSecurityChecks.firmwareRevision=false';
const showDebugMenuStatePatch = '--state.suite.settings.debug.showDebugMenu=true';
// #15670 Bug in desktop app that loglevel is ignored
const logLevelArgument = `--log-level=${process.env.LOGLEVEL ?? 'debug'}`;
const disableHWAccelerationArgument = '--disable-gpu'; // to fix chromium error GetVSyncParametersIfAvailable()
const removeUserDataArgument = '--remove-user-data-on-start';

type LaunchSuiteParams = {
    keepUserData?: boolean;
    bridgeDaemon?: boolean;
    locale?: string;
    colorScheme?: 'light' | 'dark' | 'no-preference' | null | undefined;
    artefactFolder: string;
    viewport: { width: number; height: number };
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
        path.join(appDir, './dist/app.js'),
        `--width=${params.viewport.width}`,
        `--height=${params.viewport.height}`,
        logLevelArgument,
        disableHWAccelerationArgument,
        disableHashChecksPatch,
        showDebugMenuStatePatch,
    ];

    if (params.bridgeDaemon) {
        args.push('--bridge-daemon', '--skip-new-bridge-rollout');
    } else {
        args.push('--bridge-legacy', '--bridge-test');
    }

    const deleteUserData = !params.keepUserData;
    if (deleteUserData) {
        args.push(removeUserDataArgument);
    }

    if (process.env.CANARY_FIRMWARE) {
        args.push(disableFirmwareRevisionChecksPatch);
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
        // TODO: #15646 Find out why currently pw fails to see node-bridge so we default to legacy bridge.
        await TrezorUserEnvLink.startBridge(LEGACY_BRIDGE_VERSION);
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
