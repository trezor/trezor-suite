import { ElectronApplication, Page, _electron as electron } from '@playwright/test';
import { createWriteStream, ensureDirSync, readdirSync, removeSync } from 'fs-extra';
import path from 'path';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

// specific version of legacy bridge is requested & expected
export const LEGACY_BRIDGE_VERSION = '2.0.33';
const disableHashCheckStatePatch =
    '--state.suite.settings.enabledSecurityChecks.firmwareHash=false';
const showDebugMenuStatePatch = `--state.suite.settings.debug.showDebugMenu=true`;

type LaunchSuiteParams = {
    rmUserData?: boolean;
    bridgeLegacyTest?: boolean;
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

export const launchSuiteElectronApp = async (params: LaunchSuiteParams) => {
    const defaultParams = {
        rmUserData: true,
        bridgeLegacyTest: true,
        bridgeDaemon: false,
    };
    const options = Object.assign(defaultParams, params);

    const appDir = path.join(__dirname, '../../../suite-desktop');
    // #15670 Bug in desktop app that loglevel is ignored
    const logLevelArgument = `--log-level=${process.env.LOGLEVEL ?? 'debug'}`;
    const viewportArgument = `--width=${options.viewport.width} --height=${options.viewport.height}`;
    const disableHWAccelerationArgument = '--disable-gpu'; // to fix chromium error GetVSyncParametersIfAvailable()
    if (!options.bridgeDaemon) {
        // TODO: #15646 Find out why currently pw fails to see node-bridge so we default to legacy bridge.
        await TrezorUserEnvLink.startBridge(LEGACY_BRIDGE_VERSION);
    }
    const electronApp = await electron.launch({
        cwd: appDir,
        args: [
            path.join(appDir, './dist/app.js'),
            viewportArgument,
            logLevelArgument,
            disableHWAccelerationArgument,
            ...(options.bridgeLegacyTest ? ['--bridge-legacy', '--bridge-test'] : []),
            ...(options.bridgeDaemon ? ['--bridge-daemon', '--skip-new-bridge-rollout'] : []),
            disableHashCheckStatePatch,
            showDebugMenuStatePatch,
        ],
        colorScheme: params.colorScheme,
        locale: params.locale,
        recordVideo: { dir: options.artefactFolder, size: options.viewport },
    });

    const localDataDir = await electronApp.evaluate(({ app }) => app.getPath('userData'));

    if (options.rmUserData) {
        const filesToDelete = readdirSync(localDataDir);
        filesToDelete.forEach(file => {
            // omitting Cache folder it sometimes prevents the deletion and is not necessary to delete for test idempotency
            if (file !== 'Cache') {
                try {
                    removeSync(`${localDataDir}/${file}`);
                } catch {
                    // If files does not exist do nothing.
                }
            }
        });
    }

    const logFilePath = path.join(options.artefactFolder, 'electron-logs.txt');
    ensureDirSync(options.artefactFolder);
    const logStream = createWriteStream(logFilePath, { flags: 'a' });

    electronApp.process().stdout?.on('data', data => logStream.write(data.toString()));
    electronApp
        .process()
        .stderr?.on('data', data => logStream.write(formatErrorLogMessage(data.toString())));
    electronApp.process().on('close', () => {
        logStream.end();
    });

    await electronApp.evaluate(
        (_, [resourcesPath]) => {
            // This runs in the main Electron process.
            // override global variable defined in app.ts
            global.resourcesPath = resourcesPath;

            return global.resourcesPath;
        },
        [path.join(appDir, 'build/static')],
    );

    return electronApp;
};

export const launchSuite = async (params: LaunchSuiteParams): Promise<Suite> => {
    const electronApp = await launchSuiteElectronApp(params);
    const window = await electronApp.firstWindow();

    return { electronApp, window };
};
