import { systemPreferences } from 'electron';

import { isLinux, isMacOs, isWindows } from '@trezor/env-utils';
import { createWinHelloManager } from '@trezor/suite-desktop-native';
import { serializeError } from '@trezor/utils';

import { ipcMain } from '../typed-electron';

import { Dependencies } from './index';

type BioAuthModule = (dependencies: Dependencies) => {
    onLoad: () => void;
    onQuit: () => void;
};

const PROMPT_REASON = 'Trezor Suite: validation BIO authentication to access the Suite UI';

const loadWin = async ({ mainWindowProxy }: Dependencies) => {
    const { logger } = global;
    const winHello = await createWinHelloManager({
        resourcesPath: process.resourcesPath,
        logger,
    });

    logger.info('bioAuth', 'WIN: bioAuth loaded');

    ipcMain.on('bio-auth/request', async (_, params) => {
        try {
            await winHello.requestHello(
                params.message ?? PROMPT_REASON,
                mainWindowProxy.getInstance()?.getNativeWindowHandle(),
            );

            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', {
                success: true,
            });

            return;
        } catch (error) {
            logger.info('bioAuth', `WIN: bioAuth validation failed: ${error}`);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', {
                success: false,
                message: serializeError(error),
            });
        }
    });

    ipcMain.on('bio-auth/request-availability', async () => {
        try {
            const available = await winHello.isHelloAvailable();

            if (!available) {
                logger.info('bioAuth', 'WIN: passport is not available');
            }
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/is-available', available);
        } catch (error) {
            logger.info('bioAuth', `WIN: bioAuth isAvailable failed: ${error}`);

            mainWindowProxy.getInstance()?.webContents.send('bio-auth/is-available', false);
        }
    });

    return {
        destroy: () => winHello.destroy(),
    };
};

const loadMac = ({ mainWindowProxy }: Dependencies) => {
    const { logger } = global;
    ipcMain.on('bio-auth/request', async (_, params) => {
        try {
            await systemPreferences.canPromptTouchID();
        } catch (error) {
            logger.info('bioAuth', `MAC: bioAuth canPromptTouchID failed: ${error}`);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', {
                success: false,
                message: serializeError(error),
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
            logger.info('bioAuth', `MAC: bioAuth validation failed: ${error}`);
            mainWindowProxy.getInstance()?.webContents.send('bio-auth/validated', {
                success: false,
                message: serializeError(error),
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
            logger.info('bioAuth', `MAC: bioAuth isAvailable failed: ${error}`);

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
    let destroy: null | (() => void) = null;

    const onLoad = async () => {
        if (loaded) return;
        const { logger } = global;
        logger.info('bioAuth', 'Loading');

        if (isMacOs()) {
            loaded = true;
            loadMac(dependencies);
            logger.info('bioAuth', 'Loaded for Mac');
        }

        if (isWindows()) {
            loaded = true;
            const { destroy: destroyWin } = await loadWin(dependencies);
            destroy = destroyWin;
            logger.info('bioAuth', 'Loaded for Windows');
        }

        if (isLinux()) {
            loaded = true;
            loadLinux(dependencies);
        }
    };

    const onQuit = async () => {
        const { logger } = global;
        logger.info('bioAuth', 'Stopping (app quit)');
        ipcMain.removeAllListeners('bio-auth/request');
        ipcMain.removeAllListeners('bio-auth/is-available');
        loaded = false;
        await destroy?.();
    };

    return { onLoad, onQuit };
};
