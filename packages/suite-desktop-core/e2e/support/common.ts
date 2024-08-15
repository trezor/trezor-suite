/* eslint-disable no-console */

import { Page, _electron as electron } from '@playwright/test';
import path from 'path';
import fse from 'fs-extra';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

type LaunchSuiteParams = {
    rmUserData?: boolean;
};

export const launchSuite = async (params: LaunchSuiteParams = {}) => {
    const defaultParams = {
        rmUserData: true,
    };
    const options = Object.assign(defaultParams, params);

    const appDir = path.join(__dirname, '../../../suite-desktop');
    const desiredLogLevel = process.env.LOGLEVEL ?? 'error';
    // TODO: Find out why currently pw fails to see node-bridge so we default to legacy bridge.
    await TrezorUserEnvLink.startBridge();
    const electronApp = await electron.launch({
        cwd: appDir,
        args: [
            path.join(appDir, './dist/app.js'),
            `--log-level=${desiredLogLevel}`,
            '--bridge-node-test',
            // uncomment to use legacy bridge
            // '--bridge-legacy-test',
        ],
        // when testing electron, video needs to be setup like this. it works locally but not in docker
        // recordVideo: { dir: 'test-results' },
    });

    const localDataDir = await electronApp.evaluate(({ app }) => app.getPath('userData'));

    if (options.rmUserData) {
        const filesToDelete = fse.readdirSync(localDataDir);
        filesToDelete.forEach(file => {
            // omitting Cache folder it sometimes prevents the deletion and is not necessary to delete for test idempotency
            if (file !== 'Cache') {
                fse.removeSync(`${localDataDir}/${file}`);
            }
        });
    }

    electronApp.process().stdout?.on('data', data => console.log(data.toString()));
    electronApp.process().stderr?.on('data', data => console.error(data.toString()));

    await electronApp.evaluate(
        (_, [resourcesPath]) => {
            // This runs in the main Electron process.
            // override global variable defined in app.ts
            global.resourcesPath = resourcesPath;

            return global.resourcesPath;
        },
        [path.join(appDir, 'build/static')],
    );

    const window = await electronApp.firstWindow();

    return { electronApp, window };
};

export const waitForDataTestSelector = (window: Page, selector: string, options = {}) =>
    window.waitForSelector(`[data-testid="${selector}"]`, options);

export const clickDataTest = async (window: Page, selector: string) => {
    await window.locator(`[data-testid="${selector}"]`).click();
};
