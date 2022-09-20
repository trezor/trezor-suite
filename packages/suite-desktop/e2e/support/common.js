const { _electron: electron } = require('playwright');
const path = require('path');
const { promisify } = require('util');

const mkdir = promisify(require('fs').mkdir);
const fileExists = promisify(require('fs').exists);
const copyFile = promisify(require('fs').copyFile);

module.exports.launchSuite = async () => {
    const electronApp = await electron.launch({
        cwd: '../suite-desktop',
        args: ['./dist/app.js', '--log-level=debug', '--bridge-test'],
    });
    const window = await electronApp.firstWindow();
    return { electronApp, window };
};

module.exports.patchBinaries = async () => {
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
};

module.exports.waitForDataTestSelector = (window, selector, options) =>
    window.waitForSelector(`[data-test="${selector}"]`, options);
