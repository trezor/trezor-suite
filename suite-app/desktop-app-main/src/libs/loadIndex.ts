import { type BrowserWindow } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';

import type { ILogger } from './logger';

type LoadIndexParams = {
    mainWindow: BrowserWindow;
    logger: ILogger;
};

export const loadIndex = ({ mainWindow, logger }: LoadIndexParams) => {
    if (isDevEnv) {
        logger.debug('init', `Load URL http://localhost:8000/`);
        mainWindow.loadURL('http://localhost:8000/');
    } else {
        logger.debug('init', `Load URL build/index.html`);
        mainWindow.loadFile('build/index.html');
    }
};
