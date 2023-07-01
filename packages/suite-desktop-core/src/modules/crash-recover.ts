import { app, dialog } from 'electron';

import { restartApp } from '../libs/app-utils';

import { Module } from './index';

// Reasons for prompting a restart
const unexpectedReasons = [
    'crashed', // Process crashed
    'oom', // Out of memory
    'launch-failure', // Process couldn't launch
];

export const init: Module = ({ mainWindow }) => {
    // Check if the renderer process got unexpectedly terminated
    mainWindow.webContents.on('render-process-gone', (_, { reason }) => {
        if (unexpectedReasons.includes(reason)) {
            // Note: No need to log this, the event logger already takes care of that
            const result = dialog.showMessageBoxSync(mainWindow, {
                type: 'error',
                message: `Render process terminated unexpectedly (reason: ${reason}).`,
                buttons: ['Quit', 'Restart'],
            });

            // Restart
            if (result === 1) {
                restartApp();
            } else {
                app.quit();
            }
        }
    });
};
