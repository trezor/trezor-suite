import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { Page, _electron as electron } from '@playwright/test';

const mkdir = promisify(fs.mkdir);
const fileExists = promisify(fs.exists);
const copyFile = promisify(fs.copyFile);
const chmod = promisify(fs.chmod);


export const launchSuite = async () => {
    const appDir = path.join(__dirname, '../../../suite-desktop')

    const electronApp = await electron.launch({
        cwd: appDir,
        args: ['./dist/app.js', '--log-level=debug', '--bridge-test'],
        // when testing electron, video needs to be setup like this. it works locally but not in docker
        // recordVideo: { dir: 'test-results' },
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

    electronApp.process().stdout?.on('data', data => console.log(data.toString()));
    electronApp.process().stderr?.on('data', data => console.error(data.toString()));

    const window = await electronApp.firstWindow();

    return { electronApp, window };
};

export const patchBinaries = async () => {
    const binResourcesPathFrom = path.join(__dirname, '../../..', 'suite-data/files/bin');
    const binResourcesPathTo = path.join(
        __dirname,
        '../../../..',
        '/node_modules/electron/dist/resources/bin',
    );

    const trezordPathFrom = path.join(binResourcesPathFrom, '/bridge/linux-x64/trezord');
    const trezordPathTo = path.join(binResourcesPathTo, 'bridge');
    if (!(await fileExists(trezordPathTo))) {
        await mkdir(trezordPathTo, {
            recursive: true,
        });
    }
    await copyFile(trezordPathFrom, `${trezordPathTo}/trezord`);

    const torPathFrom = path.join(binResourcesPathFrom, '/tor/linux-x64/tor');
    const torPathTo = path.join(binResourcesPathTo, 'tor');
    if (!(await fileExists(torPathTo))) {
        await mkdir(torPathTo, {
            recursive: true,
        });
    }

    await copyFile(torPathFrom, `${torPathTo}/tor`);

    const coinjoinMiddlewarePathFrom = path.join(
        binResourcesPathFrom,
        '/coinjoin/linux-x64/WalletWasabi.WabiSabiClientLibrary',
    );
    const coinjoinMiddlewarePathTo = path.join(binResourcesPathTo, 'coinjoin');

    if (!(await fileExists(coinjoinMiddlewarePathTo))) {
        await mkdir(coinjoinMiddlewarePathTo, {
            recursive: true,
        });
    }

    await copyFile(
        coinjoinMiddlewarePathFrom,
        `${coinjoinMiddlewarePathTo}/WalletWasabi.WabiSabiClientLibrary`,
    );
    // todo: for some reason, wabisabiclient lib needs to update permissions
    await chmod(
        `${coinjoinMiddlewarePathTo}/WalletWasabi.WabiSabiClientLibrary`,
        fs.constants.S_IXOTH,
    );
};

export const waitForDataTestSelector = (window: Page, selector: string, options = {}) =>
    window.waitForSelector(`[data-test="${selector}"]`, options);
