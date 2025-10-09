import { powerMonitor } from 'electron';

import type { ModuleInit } from './module';

export const SERVICE_NAME = 'power-monitor';

export const init: ModuleInit = ({ mainWindowProxy }) => {
    mainWindowProxy.on('init', mainWindow => {
        powerMonitor.on('lock-screen', () => {
            logger.info('power-monitor', 'Lock screen event detected');
        });
        powerMonitor.on('unlock-screen', () => {
            logger.info('power-monitor', 'Unlock screen event detected');
        });
        powerMonitor.on('suspend', () => {
            logger.info('power-monitor', 'Suspend event detected');
            mainWindow.webContents.send('power-monitor/suspend');
        });
        powerMonitor.on('resume', () => {
            logger.info('power-monitor', 'Resume event detected');
        });
    });
};
