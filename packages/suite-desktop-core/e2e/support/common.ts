/* eslint-disable no-console */

import { Page, _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export const launchSuite = async () => {
    const appDir = path.join(__dirname, '../../../suite-desktop');
    const desiredLogLevel = process.env.LOGLEVEL ?? 'error';
    const electronApp = await electron.launch({
        cwd: appDir,
        args: [
            path.join(appDir, './dist/app.js'),
            `--log-level=${desiredLogLevel}`,
            '--bridge-test',
        ],
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
    const localDataDir = await electronApp.evaluate(({ app }) => app.getPath('userData'));

    return { electronApp, window, localDataDir };
};

export const waitForDataTestSelector = (window: Page, selector: string, options = {}) =>
    window.waitForSelector(`[data-test="${selector}"]`, options);

// TODO: usage of .click is discouraged by playwright devs. Refactor all usage to locator.click()
export const clickDataTest = (window: Page, selector: string) => {
    window.click(`[data-test="${selector}"]`);
};

export const rmDirRecursive = (folder: string) => {
    if (fs.existsSync(folder)) {
        fs.readdirSync(folder).forEach(file => {
            const curPath = `${folder}/${file}`;
            if (fs.lstatSync(curPath).isDirectory()) {
                rmDirRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folder);
    }
};
