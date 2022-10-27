import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { Page, _electron as electron } from 'playwright';

const mkdir = promisify(fs.mkdir);
const fileExists = promisify(fs.exists);
const copyFile = promisify(fs.copyFile);

export const launchSuite = async () => {
    const electronApp = await electron.launch({
        cwd: '../suite-desktop',
        args: ['./dist/app.js', '--log-level=debug', '--bridge-test'],
    });
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
};

export const waitForDataTestSelector = (window: Page, selector: string, options = {}) =>
    window.waitForSelector(`[data-test="${selector}"]`, options);
