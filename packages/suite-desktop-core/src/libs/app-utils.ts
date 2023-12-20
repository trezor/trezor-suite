import { app } from 'electron';

export const restartApp = () => {
    const { logger } = global;

    logger.info('app', `Relaunching app with ${process.argv.slice(1).join(', ')} arguments.`);

    const options: Electron.RelaunchOptions = { args: process.argv };
    if (process.env.APPIMAGE) {
        options.execPath = process.env.APPIMAGE;
        options.args = options.args ?? [];
        options.args.unshift('--appimage-extract-and-run');
    }

    app.relaunch();
    app.quit();
};
