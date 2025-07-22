import { systemPreferences } from 'electron';
import { Passport, VerificationResult } from 'passport-desktop';

import { isLinux, isMacOs, isWindows } from '@trezor/env-utils';

import { ipcMain } from '../typed-electron';

import { Dependencies } from './index';

type BioAuthModule = (dependencies: Dependencies) => {
    onLoad: () => void;
    onQuit: () => void;
};

const PROMPT_REASON = 'Trezor Suite: validation BIO authentication to access the Suite UI';

const loadWin = ({ mainWindowProxy }: Dependencies) => {
    ipcMain.on('bio-auth/request', async (_, params) => {
        if (!Passport.available()) {
            console.error('bioAuth', 'WIN: Passport is not available');
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', {
                success: false,
                message: 'Windows Hello is not available',
            });

            return;
        }

        try {
            const verificationResult = await Passport.requestVerification(
                params.message ?? PROMPT_REASON,
            );

            if (verificationResult !== VerificationResult.Verified) {
                throw new Error('WIN: bioAuth validation failed');
            }

            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', {
                success: true,
            });

            return;
        } catch (error) {
            console.error('WIN: bioAuth validation failed', error);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', {
                success: false,
                message: error.message,
            });
        }
    });

    ipcMain.on('bio-auth/request-availability', () => {
        try {
            const available = Passport.available();

            mainWindowProxy.getInstance()?.webContents.send('bio-auth/is-available', available);
        } catch (error) {
            console.error('WIN: bioAuth isAvailable failed', error);

            mainWindowProxy.getInstance()?.webContents.send('bio-auth/is-available', false);
        }
    });
};

const loadMac = ({ mainWindowProxy }: Dependencies) => {
    ipcMain.on('bio-auth/request', async (_, params) => {
        try {
            await systemPreferences.canPromptTouchID();
        } catch (error) {
            console.error('MAC: bioAuth canPromptTouchID failed', error);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', {
                success: false,
                message: error.message,
            });

            return;
        }

        try {
            await systemPreferences.promptTouchID(params.message ?? PROMPT_REASON);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', {
                success: true,
            });

            return;
        } catch (error) {
            console.error('MAC: bioAuth validation failed', error);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', {
                success: false,
                message: error.message,
            });
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

const loadLinux = ({ mainWindowProxy }: Dependencies) => {
    ipcMain.on('bio-auth/request', () => {
        mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', {
            success: false,
            message: 'Linux is not supported',
        });
    });

    ipcMain.on('bio-auth/request-availability', () => {
        mainWindowProxy.getInstance()?.webContents.send('bio-auth/is-available', false);
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
            loaded = true;
            loadMac(dependencies);
        }

        if (isWindows()) {
            loaded = true;
            loadWin(dependencies);
        }

        if (isLinux()) {
            loaded = true;
            loadLinux(dependencies);
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
