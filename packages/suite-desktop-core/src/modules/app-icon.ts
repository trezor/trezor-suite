import { SuiteAppIconVariant } from 'packages/suite-desktop-api/src/messages';
import path from 'path';

import { ipcMain, app } from '../typed-electron';

import type { Module } from './index';

export const SERVICE_NAME = 'app-icon';

const setAppIcon = (appIcon: SuiteAppIconVariant) => {
    const { logger } = global;

    logger.info(SERVICE_NAME, `Setting ${appIcon} app icon.`);

    const appIconPath = path.join(
        global.resourcesPath,
        'images',
        'desktop',
        `1024x1024_${appIcon}.png`,
    );

    app.dock.setIcon(appIconPath);
};

export const init: Module = () => {
    ipcMain.on('app-icon/change', (_, newAppIcon) => setAppIcon(newAppIcon));
};
