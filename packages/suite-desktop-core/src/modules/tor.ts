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

import { TorProcess, TorProcessStatus } from '../libs/processes/TorProcess';
import { app, ipcMain } from '../typed-electron';

import type { Dependencies } from './index';

const load = async ({ mainWindow, store, mainThreadEmitter }: Dependencies) => {
    const { logger } = global;
    const host = '127.0.0.1';
    const port = await getFreePort();
    const controlPort = await getFreePort();
    const torDataDir = path.join(app.getPath('userData'), 'tor');

    const persistSettings = (shouldEnableTor: boolean) => {
        store.setTorSettings({ running: shouldEnableTor, host, port });
    };

    persistSettings(store.getTorSettings().running);

    const tor = new TorProcess({ host, port, controlPort, torDataDir });

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
        shouldEnableTor ? { proxy: `socks://${host}:${port}` } : { proxy: '' };

    const handleTorProcessStatus = (status: TorProcessStatus) => {
        let type: TorStatus;

        if (!status.process) {
            type = TorStatus.Disabled;
        } else if (status.isBootstrapping) {
            type = TorStatus.Enabling;
        } else if (status.service) {
            type = TorStatus.Enabled;
        } else {
            type = TorStatus.Disabled;
        }
        mainThreadEmitter.emit('module/tor-status-update', type);
        mainWindow.webContents.send('tor/status', {
            type,
        });
    };

    const handleBootstrapEvent = (bootstrapEvent: BootstrapEvent) => {
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

    const setupTor = async (shouldEnableTor: boolean) => {
        const isTorRunning = (await tor.status()).process;

        if (shouldEnableTor === isTorRunning) {
            return;
        }

        if (shouldEnableTor === true) {
            setProxy(`socks5://${host}:${port}`);
            tor.torController.on('bootstrap/event', handleBootstrapEvent);
            try {
                await tor.start();
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

        persistSettings(shouldEnableTor);
    };

    ipcMain.handle('tor/toggle', async (_: unknown, shouldEnableTor: boolean) => {
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
            await setupTor(!shouldEnableTor);

            const proxySettings = getProxySettings(!shouldEnableTor);

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
        handleTorProcessStatus(status);

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
        logger.debug('tor', `Getting status (${store.getTorSettings().running ? 'ON' : 'OFF'})`);
        const status = await tor.status();
        handleTorProcessStatus(status);
    });

    app.on('before-quit', () => {
        logger.info('tor', 'Stopping (app quit)');
        tor.stop();
    });

    if (app.commandLine.hasSwitch('tor')) {
        logger.info('tor', 'Tor enabled by command line option.');
        persistSettings(true);
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
