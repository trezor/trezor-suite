/* eslint-disable no-console */

import test, { _electron as electron, TestInfo } from '@playwright/test';
import path from 'path';
import { readdirSync, removeSync } from 'fs-extra';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { PlaywrightProjects } from '../playwright.config';

// specific version of legacy bridge is requested & expected
export const LEGACY_BRIDGE_VERSION = '2.0.33';
const disableHashCheckArgument = '--state.suite.settings.isFirmwareHashCheckDisabled=true';
const showDebugMenuArgument = `--state.suite.settings.debug.showDebugMenu=true`;

type LaunchSuiteParams = {
    rmUserData?: boolean;
    bridgeLegacyTest?: boolean;
    bridgeDaemon?: boolean;
    locale?: string;
    colorScheme?: 'light' | 'dark' | 'no-preference' | null | undefined;
    videoFolder?: string;
};

const formatErrorLogMessage = (data: string) => {
    const red = '\x1b[31m';
    const reset = '\x1b[0m';

    return `${red}${data}${reset}`;
};

export const launchSuiteElectronApp = async (params: LaunchSuiteParams = {}) => {
    const defaultParams = {
        rmUserData: true,
        bridgeLegacyTest: true,
        bridgeDaemon: false,
    };
    const options = Object.assign(defaultParams, params);

    const appDir = path.join(__dirname, '../../../suite-desktop');
    const desiredLogLevel = process.env.LOGLEVEL ?? 'error';
    if (!options.bridgeDaemon) {
        // TODO: #15646 Find out why currently pw fails to see node-bridge so we default to legacy bridge.
        await TrezorUserEnvLink.startBridge(LEGACY_BRIDGE_VERSION);
    }
    const electronApp = await electron.launch({
        cwd: appDir,
        args: [
            path.join(appDir, './dist/app.js'),
            disableHashCheckArgument,
            showDebugMenuArgument,
            `--log-level=${desiredLogLevel}`,
            ...(options.bridgeLegacyTest ? ['--bridge-legacy', '--bridge-test'] : []),
            ...(options.bridgeDaemon ? ['--bridge-daemon', '--skip-new-bridge-rollout'] : []),
        ],
        colorScheme: params.colorScheme,
        locale: params.locale,
        ...(params.videoFolder && {
            recordVideo: { dir: params.videoFolder, size: { width: 1280, height: 720 } },
        }),
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

    // #15670 Bug in desktop app that loglevel is ignored so we conditionally don't log to stdout
    if (process.env.LOGLEVEL) {
        electronApp.process().stdout?.on('data', data => console.log(data.toString()));
    }
    electronApp
        .process()
        .stderr?.on('data', data => console.error(formatErrorLogMessage(data.toString())));

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

export const launchSuite = async (params: LaunchSuiteParams = {}) => {
    const electronApp = await launchSuiteElectronApp(params);
    const window = await electronApp.firstWindow();

    return { electronApp, window };
};

export const isDesktopProject = (testInfo: TestInfo) =>
    testInfo.project.name === PlaywrightProjects.Desktop;

export const isWebProject = (testInfo: TestInfo) =>
    testInfo.project.name === PlaywrightProjects.Web;

export const getApiUrl = (webBaseUrl: string | undefined, testInfo: TestInfo) => {
    const electronApiURL = 'file:///';
    const apiURL = isDesktopProject(testInfo) ? electronApiURL : webBaseUrl;
    if (!apiURL) {
        throw new Error('apiURL is not defined');
    }

    return apiURL;
};

export const getElectronVideoPath = (videoFolder: string) => {
    const videoFilenames = readdirSync(videoFolder).filter(file => file.endsWith('.webm'));
    if (videoFilenames.length > 1) {
        console.error(
            formatErrorLogMessage(
                `Warning: More than one electron video file found in the output directory: ${videoFolder}\nAttaching only the first one: ${videoFilenames[0]}`,
            ),
        );
    }

    return path.join(videoFolder, videoFilenames[0]);
};

export function step(stepName?: string) {
    /* eslint-disable @typescript-eslint/no-unsafe-function-type */
    return function decorator(target: Function, context: ClassMethodDecoratorContext) {
        return function replacementMethod(this: any, ...args: any) {
            const name = stepName || `${this.constructor.name + '.' + (context.name as string)}`;

            return test.step(name, async () => {
                return await target.call(this, ...args);
            });
        };
    };
    /* eslint-enable @typescript-eslint/no-unsafe-function-type */
}
