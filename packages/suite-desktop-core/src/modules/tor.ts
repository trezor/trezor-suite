/**
 * Tor feature (toggle, configure)
 */
import { captureException } from '@sentry/electron';
import { session } from 'electron';
import path from 'path';

import { TorStatus, BootstrapTorEvent, HandshakeTorModule } from '@trezor/suite-desktop-api';
import { BootstrapEvent } from '@trezor/request-manager';
import TrezorConnect from '@trezor/connect';
import { getFreePort } from '@trezor/node-utils';
import { validateIpcMessage } from '@trezor/ipc-proxy';

import { TorProcess, TorProcessStatus } from '../libs/processes/TorProcess';
import { app, ipcMain } from '../typed-electron';

import type { Dependencies } from './index';

const load = async ({ mainWindow, store, mainThreadEmitter }: Dependencies) => {
    const { logger } = global;

    const options = {
        host: '127.0.0.1',
        port: 9050, // Default 9050.
        controlPort: 35095, // Default ??? TODO
        torDataDir: '', // Default `/etc/tor/torrc`
        snowflakeBinaryPath: '',
        useExternalTor: false,
    };
    // const initialSettings = store.getTorSettings();
    // console.log('initialSettings', initialSettings);
    // // TODO: check if directory exists!
    // const useExternalTor = initialSettings.torDataDir.trim() !== '';
    // console.log('useExternalTor', useExternalTor);

    // options.snowflakeBinaryPath = initialSettings.snowflakeBinaryPath;

    // if (!useExternalTor) {
    //     options.controlPort = await getFreePort();
    //     options.port = await getFreePort();
    //     options.torDataDir = path.join(app.getPath('userData'), 'tor');
    // }

    const setOptions = async () => {
        const settings = store.getTorSettings();
        console.log('settings', settings);
        // TODO: check if directory exists!
        options.useExternalTor = settings.torDataDir.trim() !== '';
        console.log('options.useExternalTor', options.useExternalTor);

        options.snowflakeBinaryPath = settings.snowflakeBinaryPath;

        if (!options.useExternalTor) {
            options.controlPort = await getFreePort();
            options.port = await getFreePort();
            options.torDataDir = path.join(app.getPath('userData'), 'tor');
        }
        store.setTorSettings({ ...settings, port: options.port });
    };

    await setOptions();

    const tor = new TorProcess({
        host: options.host,
        port: options.port,
        controlPort: options.controlPort,
        torDataDir: options.torDataDir,
        snowflakeBinaryPath: options.snowflakeBinaryPath,
    });

    const setProxy = (rule: string) => {
        logger.info('tor', `Setting proxy rules to "${rule}"`);
        // Including network session of electron auto-updater in the Tor proxy.
        const updaterSession = session.fromPartition('electron-updater');
        updaterSession.setProxy({ proxyRules: rule });
        session.defaultSession.setProxy({
            proxyRules: rule,
        });
    };

    const getProxySettings = (shouldEnableTor: boolean) =>
        shouldEnableTor ? { proxy: `socks://${options.host}:${options.port}` } : { proxy: '' };

    const handleTorProcessStatus = (status: TorProcessStatus, shouldRunTor: boolean) => {
        console.log('handleTorProcessStatus');
        console.log('status handleTorProcessStatus', status);
        let type: TorStatus;
        if (options.useExternalTor) {
            if (shouldRunTor && status.service) {
                type = TorStatus.Enabled;
            } else {
                type = TorStatus.Disabled;
            }
        } else {
            if (!status.process) {
                type = TorStatus.Disabled;
            } else if (status.isBootstrapping) {
                type = TorStatus.Enabling;
            } else if (status.service) {
                type = TorStatus.Enabled;
            } else {
                type = TorStatus.Disabled;
            }
        }

        console.log('type in handleProcessStatus', type);

        mainThreadEmitter.emit('module/tor-status-update', type);
        mainWindow.webContents.send('tor/status', {
            type,
        });
    };

    const handleBootstrapEvent = (bootstrapEvent: BootstrapEvent) => {
        console.log('handleBootstrapEvent in suite-desktop-core modules/tor');
        console.log('bootstrapEvent', bootstrapEvent);

        if (bootstrapEvent.type === 'slow') {
            mainWindow.webContents.send('tor/bootstrap', {
                type: 'slow',
            });
        }
        if (bootstrapEvent.type === 'progress') {
            logger.info(
                'tor',
                `Bootstrap - ${bootstrapEvent.progress || ''}% - ${bootstrapEvent.summary || ''}`,
            );

            const event: BootstrapTorEvent = {
                type: 'progress',
                summary: bootstrapEvent.summary || '',
                progress: {
                    current: Number(bootstrapEvent.progress),
                    total: 100,
                },
            };

            mainWindow.webContents.send('tor/bootstrap', event);
        }
    };

    const createFakeBootstrapProcess = () => {
        let progress = 0;
        const duration = 3 * 1000; // 3 seconds.
        const interval = 300; // update progress every 300ms

        const increment = (100 / duration) * interval;

        const intervalId = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(intervalId);
            }
            handleBootstrapEvent({
                type: 'progress',
                progress: `${progress}`,
                summary: 'Using External Tor fake progress',
            });
        }, interval);
    };

    const setupTor = async (shouldEnableTor: boolean) => {
        const isTorBundledRunning = (await tor.status()).process;
        const { snowflakeBinaryPath, torDataDir } = store.getTorSettings();
        // const { service, process } = await tor.status();

        await setOptions();
        console.log('setupTor');
        console.log('torDataDir', torDataDir);
        console.log('shouldEnableTor', shouldEnableTor);
        console.log('isTorRunning', isTorBundledRunning);
        // console.log('torConfig', torConfig);
        console.log('useExternalTor', options.useExternalTor);

        if (shouldEnableTor === isTorBundledRunning) {
            return;
        }

        if (shouldEnableTor === true) {
            setProxy(`socks5://${options.host}:${options.port}`);
            tor.torController.on('bootstrap/event', handleBootstrapEvent);
            try {
                tor.setTorConfig({ snowflakeBinaryPath });
                if (options.useExternalTor) {
                    await tor.startExternal();
                    createFakeBootstrapProcess();
                } else {
                    await tor.start();
                }
            } catch (error) {
                mainWindow.webContents.send('tor/bootstrap', {
                    type: 'error',
                    message: error.message,
                });
                // When there is error does not mean that the process is stop,
                // so we make sure to stop it so we are able to restart it.
                tor.stop();
                throw error;
            } finally {
                console.log('finally in setupTor');
                tor.torController.removeAllListeners();
            }
        } else {
            mainWindow.webContents.send('tor/status', {
                type: TorStatus.Disabling,
            });
            setProxy('');
            tor.torController.stop();
            await tor.stop();
        }

        store.setTorSettings({ ...store.getTorSettings(), running: shouldEnableTor });
    };

    ipcMain.handle(
        'tor/change-settings',
        (ipcEvent, payload: { snowflakeBinaryPath: string; torDataDir: string }) => {
            console.log('tor/change-settings handle');
            // TODO: check if payload contains what it should!!!
            console.log('payload', payload);
            validateIpcMessage(ipcEvent);

            try {
                store.setTorSettings({
                    running: store.getTorSettings().running,
                    host: options.host,
                    port: options.port,
                    snowflakeBinaryPath: payload.snowflakeBinaryPath,
                    torDataDir: payload.torDataDir,
                });

                return { success: true };
            } catch (error) {
                return { success: false, error };
            } finally {
                mainWindow.webContents.send('tor/settings', store.getTorSettings());
            }
        },
    );

    ipcMain.handle('tor/get-settings', ipcEvent => {
        validateIpcMessage(ipcEvent);

        try {
            return { success: true, payload: store.getTorSettings() };
        } catch (error) {
            return { success: false, error };
        }
    });

    ipcMain.handle('tor/toggle', async (ipcEvent, shouldEnableTor: boolean) => {
        console.log('tor/toggle');
        console.log('ipcEvent', ipcEvent);
        console.log('shouldEnableTor', shouldEnableTor);
        validateIpcMessage(ipcEvent);

        logger.info('tor', `Toggling ${shouldEnableTor ? 'ON' : 'OFF'}`);

        try {
            await setupTor(shouldEnableTor);

            // After setupTor we can assume TOR is available so we set the proxy in TrezorConnect
            // This is only required when 'toggle' because when app starts with TOR enable TrezorConnect is
            // correctly set in module trezor-connect-ipc.
            const proxySettings = getProxySettings(shouldEnableTor);

            await TrezorConnect.setProxy(proxySettings);

            logger.info(
                'tor',
                `${shouldEnableTor ? 'Enabled' : 'Disabled'} proxy ${proxySettings.proxy}`,
            );
        } catch (error) {
            console.log('error in tor/toggle', error);
            await setupTor(!shouldEnableTor);

            const proxySettings = getProxySettings(!shouldEnableTor);
            // Once Tor is toggled it renderer should know the new status.
            const status = await tor.status();
            console.log('status from tor.status()', status);
            handleTorProcessStatus(status, shouldEnableTor);

            await TrezorConnect.setProxy(proxySettings);

            const loggerMessage = shouldEnableTor
                ? `Failed to start: ${error.message}`
                : `Failed to stop: ${error.message}`;

            logger.error('tor', loggerMessage);
            captureException(error);

            const errorMessage = shouldEnableTor ? 'FAILED_TO_ENABLE_TOR' : 'FAILED_TO_DISABLE_TOR';

            return { success: false, error: errorMessage };
        }

        // Once Tor is toggled it renderer should know the new status.
        const status = await tor.status();
        // TODO: the status of the Tor daemon when using external will still be true even when disabling it from Suite.
        console.log('status', status);
        handleTorProcessStatus(status, shouldEnableTor);

        return { success: true };
    });

    // Handle event emitted by request-interceptor module
    let lastCircuitResetTime = 0;
    const socksTimeout = 30000; // this value reflects --SocksTimeout flag set by TorController config
    mainThreadEmitter.on('module/reset-tor-circuits', event => {
        const lastResetDiff = Date.now() - lastCircuitResetTime;
        if (lastResetDiff > socksTimeout) {
            logger.debug('tor', `Close active circuits. Triggered by identity ${event.identity}`);
            lastCircuitResetTime = Date.now();
            tor.torController.closeActiveCircuits();
        } else {
            logger.debug(
                'tor',
                `Ignore circuit reset. Triggered by identity ${event.identity} Last reset: ${lastResetDiff}ms. ago`,
            );
        }
    });

    ipcMain.on('tor/get-status', async () => {
        const shouldRunTor = store.getTorSettings().running;
        logger.debug('tor', `Getting status (${shouldRunTor ? 'ON' : 'OFF'})`);
        const status = await tor.status();
        handleTorProcessStatus(status, shouldRunTor);
    });

    app.on('before-quit', () => {
        logger.info('tor', 'Stopping (app quit)');
        tor.stop();
    });

    if (app.commandLine.hasSwitch('tor')) {
        logger.info('tor', 'Tor enabled by command line option.');
        store.setTorSettings({ ...store.getTorSettings(), running: true });
    }
};

type TorModule = (dependencies: Dependencies) => () => Promise<HandshakeTorModule>;

export const init: TorModule = dependencies => {
    let loaded = false;

    return async () => {
        if (loaded) return { shouldRunTor: false };

        loaded = true;
        await load(dependencies);
        const torSettings = dependencies.store.getTorSettings();

        return {
            shouldRunTor: torSettings.running,
        };
    };
};
