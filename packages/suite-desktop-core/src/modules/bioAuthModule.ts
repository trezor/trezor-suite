import { systemPreferences } from 'electron';

import { ipcMain } from '../typed-electron';

import { Dependencies } from './index';

type BioAuthModule = (dependencies: Dependencies) => {
    onLoad: () => void;
    onQuit: () => void;
};

const PROMPT_REASON = 'Trezor Suite: validation BIO authentication to access the Suite UI';

const load = ({ mainWindowProxy }: Dependencies) => {
    ipcMain.on('bio-auth/request', async () => {
        try {
            await systemPreferences.canPromptTouchID();
        } catch (error) {
            console.error('bioAuth', 'canPromptTouchID failed', error);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validation-failure');

            return;
        }
        try {
            await systemPreferences.promptTouchID(PROMPT_REASON);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated');

            return;
        } catch (error) {
            console.error('bioAuth validation failed', error);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validation-failure');
        }
    });
};

export const initBioAuthModule: BioAuthModule = dependencies => {
    let loaded = false;

    const onLoad = () => {
        if (loaded) return;
        const { logger } = global;
        logger.info('bioAuth', 'Loading');

        loaded = true;
        load(dependencies);
    };

    const onQuit = () => {
        const { logger } = global;
        logger.info('bioAuth', 'Stopping (app quit)');
        ipcMain.removeAllListeners('bio-auth/request');
        loaded = false;
    };

    return { onLoad, onQuit };
};
