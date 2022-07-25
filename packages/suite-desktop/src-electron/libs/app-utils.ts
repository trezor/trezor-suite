import { app, RelaunchOptions } from 'electron';

export const restartApp = () => {
    const options: RelaunchOptions = {};
    options.args = process.argv.slice(1).concat(['--relaunch']);
    options.execPath = process.execPath;
    if (process.env.APPIMAGE) {
        options.execPath = process.env.APPIMAGE;
        options.args.unshift('--appimage-extract-and-run');
    }
    app.relaunch(options);
    app.quit();
};
