/**
 * Enable DevTools
 */
import { app } from 'electron';

import { isDev } from '@suite-utils/build';

import type { Module } from './index';

const openDevToolsFlag = app.commandLine.hasSwitch('open-devtools');

const init: Module = ({ mainWindow }) => {
    if (isDev || openDevToolsFlag) {
        mainWindow.webContents.openDevTools();
    }
};

export default init;
