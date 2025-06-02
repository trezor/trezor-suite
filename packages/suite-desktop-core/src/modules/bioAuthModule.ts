import { systemPreferences } from 'electron';
import { Passport, VerificationResult } from 'passport-desktop';

import { isMacOs, isWindows } from '@trezor/env-utils';

import { ipcMain } from '../typed-electron';

import { Dependencies } from './index';

type BioAuthModule = (dependencies: Dependencies) => {
    onLoad: () => void;
    onQuit: () => void;
};

const PROMPT_REASON = 'Trezor Suite: validation BIO authentication to access the Suite UI';

const loadWin = ({ mainWindowProxy }: Dependencies) => {
    ipcMain.on('bio-auth/request', async () => {
        if (!Passport.available()) {
            console.error('bioAuth', 'WIN: Passport is not available');
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validation-failure');

            return;
        }

        try {
            const verificationResult = await Passport.requestVerification('Verify your identity');

            if (verificationResult !== VerificationResult.Verified) {
                throw new Error('WIN: bioAuth validation failed');
            }

            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated');

            return;
        } catch (error) {
            console.error('WIN: bioAuth validation failed', error);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validation-failure');
        }
    });
};

const loadMac = ({ mainWindowProxy }: Dependencies) => {
    ipcMain.on('bio-auth/request', async () => {
        try {
            await systemPreferences.canPromptTouchID();
        } catch (error) {
            console.error('MAC: bioAuth canPromptTouchID failed', error);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validation-failure');

            return;
        }
        try {
            await systemPreferences.promptTouchID(PROMPT_REASON);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated');

            return;
        } catch (error) {
            console.error('MAC: bioAuth validation failed', error);
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
        loaded = false;
    };

    return { onLoad, onQuit };
};
