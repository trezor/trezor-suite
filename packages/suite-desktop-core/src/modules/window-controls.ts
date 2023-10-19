/**
 * Window events handler
 */
import { app, ipcMain } from '../typed-electron';

import type { Module } from './index';

export const SERVICE_NAME = 'window-control';

export const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    if (process.platform === 'darwin') {
        // macOS specific window behavior
        // it is common for applications and their context menu to stay active until the user quits explicitly
        // with Cmd + Q or right-click > Quit from the context menu.

        // restore window after click on the Dock icon
        app.on('activate', () => {
            logger.info(SERVICE_NAME, 'Showing main window on activate');
            mainWindow.show();
        });
        // hide window to the Dock
        // this event listener will be removed by app.on('before-quit')
        mainWindow.on('close', event => {
            logger.info(SERVICE_NAME, 'Hiding the app after the main window has been closed');

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
            logger.info(SERVICE_NAME, 'Quitting app after all windows have been closed');
            app.quit();
        });
    }

    mainWindow.on('page-title-updated', evt => {
        evt.preventDefault();
    });

    mainWindow.on('maximize', () => {
        logger.debug(SERVICE_NAME, 'Maximize');
    });

    mainWindow.on('unmaximize', () => {
        logger.debug(SERVICE_NAME, 'Unmaximize');
    });

    mainWindow.on('enter-full-screen', () => {
        // do not log on Linux as it is triggered constantly with each movement in fullscreen mode
        if (process.platform !== 'linux') {
            logger.debug(SERVICE_NAME, 'Enter full screen');
        }
    });

    mainWindow.on('leave-full-screen', () => {
        // do not log on Linux as it is triggered constantly with each movement in windowed mode
        if (process.platform !== 'linux') {
            logger.debug(SERVICE_NAME, 'Leave full screen');
        }
    });

    mainWindow.on('moved', () => {
        logger.debug(SERVICE_NAME, 'Moved');
    });

    mainWindow.on('focus', () => {
        logger.debug(SERVICE_NAME, 'Focus');
    });

    mainWindow.on('blur', () => {
        logger.debug(SERVICE_NAME, 'Blur');
    });

    ipcMain.on('app/focus', () => {
        logger.debug(SERVICE_NAME, 'Focus requested');
        app.focus({ steal: true });
    });
};
