// Electron runs this native shutdown fixture; it is a development dependency.
// eslint-disable-next-line import/no-extraneous-dependencies
const { app, utilityProcess } = require('electron');

if (process.type === 'utility') {
    require('usb');
    process.parentPort.postMessage('usb-loaded');
    process.parentPort.once('message', () => process.exit(0));
} else {
    app.whenReady().then(() => {
        require('usb');
        if (process.argv.includes('--utility')) {
            const child = utilityProcess.fork(__filename);
            child.once('message', () => child.postMessage('quit'));
            child.once('exit', code => {
                process.exitCode = code;
                app.quit();
            });
        } else {
            app.quit();
        }
    });
}
