import { systemPreferences } from 'electron';

import { isLinux, isMacOs, isWindows } from '@trezor/env-utils';
import { validateIpcMessage } from '@trezor/ipc-proxy';
import { createWinHelloManager } from '@trezor/suite-desktop-native';
import { TypedEmitter, serializeError } from '@trezor/utils';

import { ipcMain } from '../typed-electron';
import { type Dependencies } from './module';

const PROMPT_REASON = 'Trezor Suite: validation BIO authentication to access the Suite UI';
const BLUR_LOCK_TIMEOUT_MS = 5 * 60 * 1000;
const MASTER_LOCK_TIMEOUT_MS = 24 * 60 * 60 * 1000;

type ConstructorParams = {
    logger: ILogger;
    enabled: boolean;
};

abstract class BioAuth extends TypedEmitter<{
    'validation-status-changed': (available: boolean) => void;
}> {
    constructor(params: ConstructorParams) {
        super();
        this.logger = params.logger;
        this.enabled = params.enabled;
    }
    abstract isAvailable(): Promise<boolean>;
    abstract validate(
        message?: string,
    ): Promise<{ success: true } | { success: false; message: string }>;
    logger: ILogger;
    enabled: boolean;
    initialized?: boolean;

    init(): Promise<void> {
        this.initialized = true;

        return Promise.resolve();
    }

    private invalidationTimeouts: Record<string, NodeJS.Timeout> = {};

    private validated: number = 0;

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    private invalidate() {
        // set timestamp to 0 meaning "not validated". This is used to compare with max allowed time.
        this.validated = 0;
        this.emit('validation-status-changed', false);
    }

    public isValidated() {
        // verbosely returning false in case attacker changed system time-locally, the check below could be bypassed
        if (this.validated === 0) return false;

        // has not been last validated longer than 24 hours ago
        return this.validated + MASTER_LOCK_TIMEOUT_MS > Date.now();
    }

    private attachInvalidationTimeout(name: string, ms: number) {
        if (!this.enabled) return;
        this.clearInvalidationTimeout(name);
        this.invalidationTimeouts[name] = setTimeout(() => {
            this.logger.info('bioAuth', `invalidation timeout [${name}] triggered`);

            this.invalidate();
        }, ms);
    }

    private clearInvalidationTimeout(name: string) {
        if (this.invalidationTimeouts[name]) {
            clearTimeout(this.invalidationTimeouts[name]);
            delete this.invalidationTimeouts[name];
        }
    }

    onValidationSuccess() {
        this.logger.info('bioAuth', 'Validation successful');

        this.validated = Date.now();
        this.emit('validation-status-changed', this.isValidated());

        this.attachInvalidationTimeout('master', MASTER_LOCK_TIMEOUT_MS);
    }

    onBlurred() {
        this.attachInvalidationTimeout('blur', BLUR_LOCK_TIMEOUT_MS);
    }

    onFocused() {
        this.clearInvalidationTimeout('blur');
    }

    dispose(): void {
        Object.keys(this.invalidationTimeouts).forEach(key => this.clearInvalidationTimeout(key));
    }
}

class BioAuthMac extends BioAuth {
    isAvailable() {
        return Promise.resolve(systemPreferences.canPromptTouchID());
    }

    validate(message?: string) {
        return systemPreferences
            .promptTouchID(message ?? PROMPT_REASON)
            .then(() => {
                this.onValidationSuccess();

                return { success: true as const };
            })
            .catch(error => ({
                success: false as const,
                message: serializeError(error),
            }));
    }
}

class BioAuthLinux extends BioAuth {
    isAvailable() {
        return Promise.resolve(false);
    }

    validate(_message?: string) {
        return Promise.resolve({
            success: false,
            message: 'Linux is not supported',
        });
    }
}

class BioAuthWindows extends BioAuth {
    private winHello: Awaited<ReturnType<typeof createWinHelloManager>> | null;
    private initPromise: Promise<Awaited<ReturnType<typeof createWinHelloManager>> | null>;

    constructor(params: ConstructorParams) {
        super(params);
        this.initPromise = Promise.resolve(null);
        this.winHello = null;
    }

    async init() {
        // Call super.init() first to set initialized flag
        await super.init();

        this.initPromise = Promise.race<Awaited<ReturnType<typeof createWinHelloManager>>>([
            createWinHelloManager({
                resourcesPath: process.resourcesPath,
                logger,
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('WinHello initialization timeout')), 40_000),
            ),
        ])
            .then(winHello => {
                this.winHello = winHello;
                logger.info('bioAuth', 'WinHelloManager initialized successfully');

                return winHello;
            })
            .catch(err => {
                this.winHello = null;
                logger.warn('bioAuth', `WinHelloManager initialization failed: ${err}`);

                return null;
            });

        // Don't await initPromise - let it complete in background
        // This ensures init() returns successfully even if WinHello setup fails
    }

    async isAvailable() {
        const winHello = await this.initPromise;
        if (!winHello) {
            return false;
        }

        try {
            return await winHello.isHelloAvailable();
        } catch (err) {
            logger.warn('bioAuth', `Error checking Windows Hello availability: ${err}`);

            return false;
        }
    }

    async validate(message?: string) {
        const winHello = await this.initPromise;
        if (!winHello) {
            throw new Error('WinHelloManager is not available');
        }

        return winHello
            .requestHello(message ?? PROMPT_REASON)
            .then(() => {
                this.onValidationSuccess();

                return { success: true as const };
            })
            .catch(error => ({
                success: false as const,
                message: serializeError(error),
            }));
    }

    dispose() {
        super.dispose();
        if (!this.winHello) return;
        this.winHello.destroy();
    }
}

export const initBioAuthModule = ({
    mainWindowProxy,
    store,
}: {
    mainWindowProxy: Dependencies['mainWindowProxy'];
    store: Dependencies['store'];
}) => {
    let bioAuth: BioAuth | undefined;
    let interval: NodeJS.Timeout;
    const onLoad = async () => {
        if (bioAuth) return;
        const { logger } = global;
        logger.info('bioAuth', `Loading. Enabled in store: ${store.getBioAuthSettings().enabled}`);

        const constructorParams = {
            logger,
            enabled: store.getBioAuthSettings().enabled || false,
        };

        if (isMacOs()) {
            bioAuth = new BioAuthMac(constructorParams);
            logger.info('bioAuth', 'Loaded for Mac');
        } else if (isWindows()) {
            bioAuth = new BioAuthWindows(constructorParams);
            logger.info('bioAuth', 'Loaded for Windows');
        } else if (isLinux()) {
            bioAuth = new BioAuthLinux(constructorParams);
            logger.info('bioAuth', 'Loaded for Linux');
        } else {
            logger.info('bioAuth', 'Unsupported platform for BioAuth');

            return;
        }

        ipcMain.handle('bio-auth/is-bio-auth-available', ipcEvent => {
            validateIpcMessage({ ipcEvent });

            // Necessary check for race condition: UI might ask for availability before await bioAuth.init()
            if (!bioAuth) return Promise.resolve(false);

            return bioAuth.isAvailable();
        });

        ipcMain.handle('bio-auth/set-bio-auth-settings', (ipcEvent, params) => {
            validateIpcMessage({ ipcEvent });

            store.setBioAuthSettings(params);
        });

        ipcMain.handle('bio-auth/get-bio-auth-settings', ipcEvent => {
            validateIpcMessage({ ipcEvent });

            return { enabled: false, ...store.getBioAuthSettings() };
        });

        store.onBioAuthSettingsChange(newSettings => {
            if (!newSettings) return;
            const { enabled } = newSettings;
            if (typeof enabled !== 'boolean') return;
            mainWindowProxy
                .getInstance()
                ?.webContents.send('bio-auth/settings-changed', { enabled });
            bioAuth?.setEnabled(enabled);
        });

        ipcMain.handle('bio-auth/validate-bio-auth', (ipcEvent, params) => {
            validateIpcMessage({ ipcEvent });

            if (!bioAuth?.initialized) {
                throw new Error('BioAuth module is not initialized (calling validate-bio-auth)');
            }

            return bioAuth.validate(params.message ?? PROMPT_REASON);
        });

        ipcMain.handle('bio-auth/get-validation-status', ipcEvent => {
            validateIpcMessage({ ipcEvent });
            if (!bioAuth?.initialized) {
                throw new Error(
                    'BioAuth module is not initialized (calling get-validation-status)',
                );
            }

            return bioAuth.isValidated();
        });

        bioAuth.on('validation-status-changed', validated => {
            logger.info('bioAuth', `Validation status changed: ${validated}`);

            mainWindowProxy
                .getInstance()
                ?.webContents.send('bio-auth/validation-status-changed', validated);
        });

        mainWindowProxy.on('init', mainWindow => {
            mainWindow.on('focus', () => {
                bioAuth?.onFocused();
            });

            mainWindow.on('blur', () => {
                bioAuth?.onBlurred();
            });
        });

        await bioAuth.init();

        // load initial value and then poll for changes
        bioAuth.isAvailable().then(initialValue => {
            let prevAvailable: boolean = initialValue;
            interval = setInterval(() => {
                bioAuth?.isAvailable().then(value => {
                    if (prevAvailable === value) return;
                    prevAvailable = value;
                    logger.info('bioAuth', `Availability changed: ${value}`);
                    mainWindowProxy
                        .getInstance()
                        ?.webContents.send('bio-auth/bio-auth-availability-changed', value);
                });
            }, 10_000);
        });
    };

    const onQuit = () => {
        const { logger } = global;
        logger.info('bioAuth', 'Stopping (app quit)');
        clearInterval(interval);
        bioAuth?.dispose();
        bioAuth = undefined;
    };

    return { onLoad, onQuit };
};
