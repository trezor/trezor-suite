/**
 * Tor feature (toggle, configure)
 */
import { captureException } from '@sentry/electron';
import { session } from 'electron';
import TorProcess from '../libs/processes/TorProcess';
import { onionDomain } from '../config';
import { app, ipcMain } from '../typed-electron';
import { getFreePort } from '../libs/getFreePort';
import TrezorConnect from '@trezor/connect';
import type { Dependencies } from './index';
import { HandshakeTorModule } from 'packages/suite-desktop-api/lib/messages';

const load = async ({ mainWindow, store, interceptor }: Dependencies) => {
    const { logger } = global;
    const host = '127.0.0.1';
    const port = await getFreePort();
    const address = `${host}:${port}`;
    const controlPort = await getFreePort();
    const authFilePath = app.getPath('userData');

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
    const tor = new TorProcess({ host, port, controlPort, authFilePath });

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
        shouldEnableTor
            ? {
                  proxy: `socks://${address}`,
                  useOnionLinks: true,
              }
            : { proxy: '', useOnionLinks: false };

    const setupTor = async (settings: TorSettings) => {
        const shouldEnableTor = settings.running;
        const isTorRunning = (await tor.status()).process;

        if (shouldEnableTor === isTorRunning) {
            return;
        }

        if (shouldEnableTor === true) {
            setProxy(`socks5://${host}:${port}`);
            tor.torController.on(
                'bootstrap/event',
                (bootstrapEvent: { progress: string; summary: string }) => {
                    if (bootstrapEvent && bootstrapEvent.summary && bootstrapEvent.progress) {
                        logger.info(
                            'tor',
                            `Bootstrap - ${bootstrapEvent.progress || ''}% - ${
                                bootstrapEvent.summary || ''
                            }`,
                        );

                        mainWindow.webContents.send('tor/bootstrap', {
                            type: 'progress',
                            summary: bootstrapEvent.summary,
                            progress: {
                                current: Number(bootstrapEvent.progress),
                                total: 100,
                            },
                        });
                    }
                },
            );
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
            setProxy('');
            tor.torController.stopWhileLoading();
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
        mainWindow.webContents.send('tor/status', store.getTorSettings().running);
        return { success: true };
    });

    ipcMain.on('tor/get-status', () => {
        logger.debug('tor', `Getting status (${store.getTorSettings().running ? 'ON' : 'OFF'})`);
        mainWindow.webContents.send('tor/status', store.getTorSettings().running);
    });

    ipcMain.handle('tor/get-address', () => {
        logger.debug('tor', `Getting address (${store.getTorSettings().address})`);
        return store.getTorSettings().address;
    });

    interceptor.onBeforeRequest(details => {
        const { hostname, protocol } = new URL(details.url);

        // Redirect outgoing trezor.io requests to .onion domain
        if (
            store.getTorSettings().running &&
            hostname.endsWith('trezor.io') &&
            protocol === 'https:'
        ) {
            logger.info('tor', `Rewriting ${details.url} to .onion URL`);
            return {
                redirectURL: details.url.replace(
                    /https:\/\/(([a-z0-9]+\.)*)trezor\.io(.*)/,
                    `http://$1${onionDomain}$3`,
                ),
            };
        }
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

const init: TorModule = dependencies => {
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

export default init;
