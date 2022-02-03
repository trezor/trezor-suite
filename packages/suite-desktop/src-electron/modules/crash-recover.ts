import { app, dialog } from 'electron';
import { Module } from '../libs/modules';

// Reasons for prompting a restart
const unexpectedReasons = [
    'crashed', // Process crashed
    'oom', // Out of memory
    'launch-failure', // Process couldn't launch
];

const init: Module = ({ mainWindow }) => {
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
                app.relaunch();
            }

            app.exit();
        }
    });
};

export default init;
