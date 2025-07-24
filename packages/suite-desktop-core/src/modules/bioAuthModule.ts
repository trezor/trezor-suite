import { systemPreferences } from 'electron';
import createWinHello from 'win-hello';

import { isMacOs, isWindows } from '@trezor/env-utils';

import { ipcMain } from '../typed-electron';

import { Dependencies } from './index';

type BioAuthModule = (dependencies: Dependencies) => {
    onLoad: () => void;
    onQuit: () => void;
};

const PROMPT_REASON = 'Trezor Suite: validation BIO authentication to access the Suite UI';

const loadWin = ({ mainWindowProxy }: Dependencies) => {
    const winHello = createWinHello();
    ipcMain.on('bio-auth/request', async () => {
        try {
            await winHello.requestHello(PROMPT_REASON);

            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', true);

            return;
        } catch (error) {
            console.error('WIN: bioAuth validation failed', error);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', false);
        }
    });

    ipcMain.on('bio-auth/request-availability', async () => {
        try {
            const available = await winHello.isHelloAvailable();

            mainWindowProxy.getInstance()?.webContents.send('bio-auth/is-available', available);
        } catch (error) {
            console.error('WIN: bioAuth isAvailable failed', error);

            mainWindowProxy.getInstance()?.webContents.send('bio-auth/is-available', false);
        }
    });
};

const loadMac = ({ mainWindowProxy }: Dependencies) => {
    ipcMain.on('bio-auth/request', async () => {
        try {
            await systemPreferences.canPromptTouchID();
        } catch (error) {
            console.error('MAC: bioAuth canPromptTouchID failed', error);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', false);

            return;
        }

        try {
            await systemPreferences.promptTouchID(PROMPT_REASON);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', true);

            return;
        } catch (error) {
            console.error('MAC: bioAuth validation failed', error);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', false);
        }
    });

    ipcMain.on('bio-auth/request-availability', async () => {
        try {
            const canPromptTouchID = await systemPreferences.canPromptTouchID();

            mainWindowProxy
                .getInstance()
                ?.webContents.send('bio-auth/is-available', canPromptTouchID);
        } catch (error) {
            console.error('MAC: bioAuth isAvailable failed', error);

            mainWindowProxy.getInstance()?.webContents.send('bio-auth/is-available', false);
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

        if (isMacOs()) {
            loadMac(dependencies);
        }

        if (isWindows()) {
            loadWin(dependencies);
        }
    };

    const onQuit = () => {
        const { logger } = global;
        logger.info('bioAuth', 'Stopping (app quit)');
        ipcMain.removeAllListeners('bio-auth/request');
        ipcMain.removeAllListeners('bio-auth/is-available');
        loaded = false;
    };

    return { onLoad, onQuit };
};
