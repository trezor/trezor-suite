import { ipcMain as electronIpcMain, systemPreferences } from 'electron';
import { Passport, VerificationResult } from 'passport-desktop';

import { isMacOs, isWindows } from '@trezor/env-utils';

import { Dependencies } from './index';

type BioAuthModule = (dependencies: Dependencies) => {
    onLoad: () => void;
    onQuit: () => void;
};

const PROMPT_REASON = 'Trezor Suite: validation BIO authentication to access the Suite UI';

const loadWin = () => {
    // Using the native electron ipcMain for handle method
    electronIpcMain.handle('bio-auth/authenticate', async () => {
        if (!Passport.available()) {
            console.error('bioAuth', 'WIN: Passport is not available');

            return { success: false, error: 'Passport is not available' };
        }

        try {
            const verificationResult = await Passport.requestVerification(PROMPT_REASON);

            if (verificationResult !== VerificationResult.Verified) {
                throw new Error('WIN: bioAuth validation failed');
            }

            return { success: true };
        } catch (error) {
            console.error('WIN: bioAuth validation failed', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });

    electronIpcMain.handle('bio-auth/is-available', () => {
        try {
            const available = Passport.available();

            return { success: true, payload: available };
        } catch (error) {
            console.error('WIN: bioAuth isAvailable failed', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
};

const loadMac = () => {
    // Using the native electron ipcMain for handle method
    electronIpcMain.handle('bio-auth/authenticate', async () => {
        try {
            await systemPreferences.canPromptTouchID();
        } catch (error) {
            console.error('MAC: bioAuth canPromptTouchID failed', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'TouchID not available',
            };
        }

        try {
            await systemPreferences.promptTouchID(PROMPT_REASON);

            return { success: true };
        } catch (error) {
            console.error('MAC: bioAuth validation failed', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed',
            };
        }
    });

    electronIpcMain.handle('bio-auth/is-available', async () => {
        try {
            const canPromptTouchID = await systemPreferences.canPromptTouchID();

            return { success: true, payload: canPromptTouchID };
        } catch (error) {
            console.error('MAC: bioAuth isAvailable failed', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'TouchID not available',
            };
        }
    });
};

export const initBioAuthModule: BioAuthModule = _dependencies => {
    let loaded = false;

    const onLoad = () => {
        if (loaded) return;
        const { logger } = global;
        logger.info('bioAuth', 'Loading');

        loaded = true;

        if (isMacOs()) {
            loadMac();
        }

        if (isWindows()) {
            loadWin();
        }
    };

    const onQuit = () => {
        const { logger } = global;
        logger.info('bioAuth', 'Stopping (app quit)');
        electronIpcMain.removeHandler('bio-auth/authenticate');
        electronIpcMain.removeHandler('bio-auth/is-available');
        loaded = false;
    };

    return { onLoad, onQuit };
};
