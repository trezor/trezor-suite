import { ipcMain } from 'electron';
import { getOSVersion } from '@desktop-electron/libs/user-data';

export const init = () => {
    const { logger } = global;
    ipcMain.handle('analytics/get-os-version', () => {
        logger.info('analytics', 'Getting OS version');
        const resp = getOSVersion();
        return resp;
    });
};

export default init;
