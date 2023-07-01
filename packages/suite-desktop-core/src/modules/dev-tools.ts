/**
 * Enable DevTools
 */
import { app } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';

import type { Module } from './index';

const openDevToolsFlag = app.commandLine.hasSwitch('open-devtools');

export const init: Module = ({ mainWindow }) => {
    if (isDevEnv || openDevToolsFlag) {
        mainWindow.webContents.openDevTools();
    }
};
