import { ipcMain } from '../ipcMain';
import type { ModuleInit } from './module';
import { Store } from '../libs/store';

export const SERVICE_NAME = 'debug';

export const init: ModuleInit = () => {
    const store = Store.getStore();

    ipcMain.on('debug/set-mode', (_, isDebugModeActive) => {
        store.setIsDebugModeActive(isDebugModeActive === true);
    });
};
