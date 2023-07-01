/**
 * Window events handler
 */
import { app, ipcMain } from '../typed-electron';

import { Module } from './index';

export const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    if (process.platform === 'darwin') {
        // macOS specific window behavior
        // it is common for applications and their context menu to stay active until the user quits explicitly
        // with Cmd + Q or right-click > Quit from the context menu.

        // restore window after click on the Dock icon
        app.on('activate', () => {
            logger.info('window-control', 'Showing main window on activate');
            mainWindow.show();
        });
        // hide window to the Dock
        // this event listener will be removed by app.on('before-quit')
        mainWindow.on('close', event => {
            logger.info('window-control', 'Hiding the app after the main window has been closed');

            event.preventDefault();
            // this is a workaround for black screen issue when trying to close an maximized window
            if (mainWindow.isFullScreen()) {
                mainWindow.once('leave-full-screen', () => mainWindow.hide());
                mainWindow.setFullScreen(false);
            } else {
                app.hide();
            }
        });
    } else {
        // other platform just kills the app
        app.on('window-all-closed', () => {
            logger.info('window-control', 'Quitting app after all windows have been closed');
            app.quit();
        });
    }

    mainWindow.on('page-title-updated', evt => {
        evt.preventDefault();
    });

    mainWindow.on('maximize', () => {
        logger.debug('window-control', 'Maximize');
    });

    mainWindow.on('unmaximize', () => {
        logger.debug('window-control', 'Unmaximize');
    });

    mainWindow.on('enter-full-screen', () => {
        // do not log on Linux as it is triggered constantly with each movement in fullscreen mode
        if (process.platform !== 'linux') {
            logger.debug('window-control', 'Enter full screen');
        }
    });

    mainWindow.on('leave-full-screen', () => {
        // do not log on Linux as it is triggered constantly with each movement in windowed mode
        if (process.platform !== 'linux') {
            logger.debug('window-control', 'Leave full screen');
        }
    });

    mainWindow.on('moved', () => {
        logger.debug('window-control', 'Moved');
    });

    mainWindow.on('focus', () => {
        logger.debug('window-control', 'Focus');
    });

    mainWindow.on('blur', () => {
        logger.debug('window-control', 'Blur');
    });

    ipcMain.on('app/focus', () => {
        logger.debug('window-control', 'Focus requested');
        app.focus({ steal: true });
    });
};
