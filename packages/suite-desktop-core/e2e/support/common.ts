/* eslint-disable no-console */

import path from 'path';
import { Page, _electron as electron } from '@playwright/test';

export const launchSuite = async () => {
    const appDir = path.join(__dirname, '../../../suite-desktop');

    const electronApp = await electron.launch({
        cwd: appDir,
        args: [path.join(appDir, './dist/app.js'), '--log-level=debug', '--bridge-test'],
        // when testing electron, video needs to be setup like this. it works locally but not in docker
        // recordVideo: { dir: 'test-results' },
    });

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
    window.waitForSelector(`[data-test="${selector}"]`, options);
