import { app } from 'electron';

export const restartApp = () => {
    const { logger } = global;

    logger.info('app', `Relaunching app with ${process.argv.slice(1).join(', ')} arguments.`);

    app.relaunch();
    app.quit();
};
