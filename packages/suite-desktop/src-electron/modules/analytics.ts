import { ipcMain } from 'electron';
import { getOSVersion } from '@lib/user-data';

export const init = () => {
    ipcMain.handle('analytics/get-os-version', () => {
        const resp = getOSVersion();
        return resp;
    });
};

export default init;
