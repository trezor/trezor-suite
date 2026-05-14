import { type BrowserWindow } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';

export const loadIndex = (mainWindow: BrowserWindow) => {
    const { logger } = global;

    if (isDevEnv) {
        logger.debug('init', `Load URL http://localhost:8000/`);
        mainWindow.loadURL('http://localhost:8000/');
    } else {
        logger.debug('init', `Load URL build/index.html`);
        mainWindow.loadFile('build/index.html');
    }
};
