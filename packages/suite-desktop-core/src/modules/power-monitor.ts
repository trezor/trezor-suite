import { powerMonitor } from 'electron';

import type { ModuleInit } from './index';

export const SERVICE_NAME = 'power-monitor';

export const init: ModuleInit = ({ mainWindowProxy }) => {
    mainWindowProxy.on('init', mainWindow => {
        powerMonitor.on('lock-screen', () => {
            logger.info('power-monitor', 'Lock screen event detected');
            mainWindow.webContents.send('power-monitor/screen-locked');
        });
    });
};
