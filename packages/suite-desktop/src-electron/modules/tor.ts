/**
 * Tor feature (toggle, configure)
 */
import { captureException } from '@sentry/electron';
import { session } from 'electron';
import TorProcess from '../libs/processes/TorProcess';
import { onionDomain } from '../config';
import { app, ipcMain } from '../typed-electron';
import { Module } from './index';
import { getFreePort } from '../libs/getFreePort';
import TrezorConnect from '@trezor/connect';

const init: Module = async ({ mainWindow, store, interceptor }) => {
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
            await tor.start();

            setProxy(`socks5://${host}:${port}`);
        } else {
            await tor.stop();
            setProxy('');
        }

        persistSettings(settings);

        // Notify the renderer.
        mainWindow.webContents.send('tor/status', settings.running);
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

        return { success: true };
    });

    // TODO: Change to ipcMain.handle?
    // desktopApi.getTorStatus();
    // desktopApi.on('tor/status', updateTorStatus);
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

    await setupTor(store.getTorSettings());
};

export default init;
