import { type BrowserWindow } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';

import type { ILogger } from './logger';

type LoadIndexParams = {
    mainWindow: BrowserWindow;
    logger: ILogger;
    rendererUrl?: string;
};

export const loadIndex = ({ mainWindow, logger, rendererUrl }: LoadIndexParams) => {
    if (isDevEnv) {
        logger.debug('init', `Load URL http://localhost:8000/`);
        mainWindow.loadURL('http://localhost:8000/');
    } else if (rendererUrl) {
        logger.debug('init', `Load URL ${rendererUrl}`);
        mainWindow.loadURL(rendererUrl);
    } else {
        logger.debug('init', `Load URL build/index.html`);
        mainWindow.loadFile('build/index.html');
    }
};
