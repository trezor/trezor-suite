import { ipcMain } from 'electron';
import { getOsType } from '@desktop-electron/libs/user-data';

export const init = () => {
    const { logger } = global;
    ipcMain.handle('analytics/get-os-type', () => {
        logger.info('analytics', 'Getting OS');
        const resp = getOsType();
        return resp;
    });
};

export default init;
