import { powerMonitor } from 'electron';

import type { ModuleInit } from './module';

export const SERVICE_NAME = 'power-monitor';

export const init: ModuleInit = ({ mainWindowProxy }) => {
    powerMonitor.on('lock-screen', () => {
        logger.info('power-monitor', 'Lock screen event detected');
    });
    powerMonitor.on('unlock-screen', () => {
        logger.info('power-monitor', 'Unlock screen event detected');
    });
    // Use getInstance() so this always targets the current window, even if the window is recreated.
    powerMonitor.on('suspend', () => {
        logger.info('power-monitor', 'Suspend event detected');
        mainWindowProxy.getInstance()?.webContents.send('power-monitor/suspend');
    });
    powerMonitor.on('resume', () => {
        logger.info('power-monitor', 'Resume event detected');
    });
};
