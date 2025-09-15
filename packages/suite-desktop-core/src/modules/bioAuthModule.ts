import { systemPreferences } from 'electron';

import { isLinux, isMacOs, isWindows } from '@trezor/env-utils';
import { validateIpcMessage } from '@trezor/ipc-proxy';
import { createWinHelloManager } from '@trezor/suite-desktop-native';
import { scheduleAction, serializeError } from '@trezor/utils';

import { ipcMain } from '../typed-electron';

const PROMPT_REASON = 'Trezor Suite: validation BIO authentication to access the Suite UI';
const TIMEOUT = 60_000;

const loadWin = async () => {
    const { logger } = global;
    const winHello = await createWinHelloManager({
        resourcesPath: process.resourcesPath,
        logger,
    });

    logger.info('bioAuth', 'WIN: bioAuth loaded');

    ipcMain.handle('bio-auth/validate-bio-auth', (ipcEvent, params) => {
        validateIpcMessage(ipcEvent);

        return scheduleAction(
            async () => {
                try {
                    await winHello.requestHello(params.message ?? PROMPT_REASON);

                    return {
                        success: true as const,
                    };
                } catch (error) {
                    logger.info('bioAuth', `WIN: bioAuth validation failed: ${error}`);

                    return {
                        success: false as const,
                        message: serializeError(error),
                    };
                }
            },
            {
                timeout: TIMEOUT,
            },
        ).catch(() => ({
            success: false as const,
            message: 'timeout',
        }));
    });

    ipcMain.handle('bio-auth/is-bio-auth-available', ipcEvent => {
        validateIpcMessage(ipcEvent);

        return scheduleAction(
            async () => {
                try {
                    const available = await winHello.isHelloAvailable();

                    if (!available) {
                        logger.info('bioAuth', 'WIN: passport is not available');
                    }

                    return available;
                } catch (error) {
                    logger.info('bioAuth', `WIN: bioAuth isAvailable failed: ${error}`);

                    return false;
                }
            },
            {
                timeout: TIMEOUT,
            },
        ).catch(() => false);
    });

    return {
        destroy: () => winHello.destroy(),
    };
};

const loadMac = () => {
    const { logger } = global;
    ipcMain.handle('bio-auth/validate-bio-auth', (ipcEvent, params) => {
        validateIpcMessage(ipcEvent);

        return scheduleAction(
            async () => {
                try {
                    // todo: canPromptTouchID is synchronous. can it really throw?
                    await systemPreferences.canPromptTouchID();
                } catch (error) {
                    logger.info('bioAuth', `MAC: bioAuth canPromptTouchID failed: ${error}`);

                    return {
                        success: false,
                        message: serializeError(error),
                    };
                }

                try {
                    await systemPreferences.promptTouchID(params.message ?? PROMPT_REASON);

                    return {
                        success: true as const,
                    };
                } catch (error) {
                    logger.info('bioAuth', `MAC: bioAuth validation failed: ${error}`);

                    return {
                        success: false as const,
                        message: serializeError(error),
                    };
                }
            },
            { timeout: TIMEOUT },
        ).catch(() => ({ success: false as const, message: 'timeout' }));
    });

    ipcMain.handle('bio-auth/is-bio-auth-available', ipcEvent => {
        validateIpcMessage(ipcEvent);

        return scheduleAction(
            async (): Promise<boolean> => {
                try {
                    const canPromptTouchID = await systemPreferences.canPromptTouchID();

                    return canPromptTouchID;
                } catch (error) {
                    logger.info('bioAuth', `MAC: bioAuth isAvailable failed: ${error}`);

                    return false;
                }
            },
            { timeout: TIMEOUT },
        ).catch(() => false);
    });
};

const loadLinux = () => {
    ipcMain.handle('bio-auth/validate-bio-auth', ipcEvent => {
        validateIpcMessage(ipcEvent);

        return {
            success: false,
            message: 'Linux is not supported',
        };
    });

    ipcMain.handle('bio-auth/is-bio-auth-available', ipcEvent => {
        validateIpcMessage(ipcEvent);

        return false;
    });
};

export const initBioAuthModule = () => {
    let loaded = false;
    let destroy: null | (() => void) = null;

    const onLoad = async () => {
        if (loaded) return;
        const { logger } = global;
        logger.info('bioAuth', 'Loading');

        if (isMacOs()) {
            loaded = true;
            loadMac();
            logger.info('bioAuth', 'Loaded for Mac');
        }

        if (isWindows()) {
            loaded = true;
            const { destroy: destroyWin } = await loadWin();
            destroy = destroyWin;
            logger.info('bioAuth', 'Loaded for Windows');
        }

        if (isLinux()) {
            loaded = true;
            loadLinux();
        }
    };

    const onQuit = async () => {
        const { logger } = global;
        logger.info('bioAuth', 'Stopping (app quit)');
        loaded = false;
        await destroy?.();
    };

    return { onLoad, onQuit };
};
