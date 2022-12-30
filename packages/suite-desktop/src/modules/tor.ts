/**
 * Tor feature (toggle, configure)
 */
import { captureException } from '@sentry/electron';
import { session } from 'electron';
import {
    BootstrapTorEvent,
    HandshakeTorModule,
    TorStatusEventType,
    TOR_STATUS_EVENT_TYPE,
} from 'packages/suite-desktop-api/lib/messages';
import { BootstrapEvent } from 'packages/request-manager/lib/types';

import TrezorConnect from '@trezor/connect';

import { TorProcess, TorProcessStatus } from '../libs/processes/TorProcess';
import { app, ipcMain } from '../typed-electron';
import { getFreePort } from '../libs/getFreePort';

import type { Dependencies } from './index';

const load = async ({ mainWindow, store }: Dependencies) => {
    const { logger } = global;
    const host = '127.0.0.1';
    const port = await getFreePort();
    const address = `${host}:${port}`;
    const controlPort = await getFreePort();
    const userData = app.getPath('userData');
    const torDataDir = `${userData}/tor`;

    /**
     * Merges given TorSettings with settings already present in the store,
     * persists the result and returns it.
     */
    const persistSettings = (options: Partial<TorSettings>): TorSettings => {
        const newSettings = { ...store.getTorSettings(), ...options };
        store.setTorSettings(newSettings);
        return newSettings;
    };

    persistSettings({ address });
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
        shouldEnableTor ? { proxy: `socks://${address}` } : { proxy: '' };

    const handleTorProcessStatus = (status: TorProcessStatus) => {
        let type: TorStatusEventType;

        if (!status.process) {
            type = TOR_STATUS_EVENT_TYPE.Disabled;
        } else if (status.isBootstrapping) {
            type = TOR_STATUS_EVENT_TYPE.Bootstrapping;
        } else if (status.service) {
            type = TOR_STATUS_EVENT_TYPE.Enabled;
        } else {
            type = TOR_STATUS_EVENT_TYPE.Disabled;
        }
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

    const setupTor = async (settings: TorSettings) => {
        const shouldEnableTor = settings.running;
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
                type: TOR_STATUS_EVENT_TYPE.Disabling,
            });
            setProxy('');
            tor.torController.stop();
            await tor.stop();
        }

        persistSettings(settings);
    };

    ipcMain.handle('tor/toggle', async (_: unknown, shouldEnableTor: boolean) => {
        logger.info('tor', `Toggling ${shouldEnableTor ? 'ON' : 'OFF'}`);

        const settings: TorSettings = { ...store.getTorSettings(), running: shouldEnableTor };

        try {
            await setupTor(settings);

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
            await setupTor({ ...settings, running: !shouldEnableTor });

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
        persistSettings({ running: true });
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
