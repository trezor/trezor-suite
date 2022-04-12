/**
 * Tor feature (toggle, configure)
 */
import { session } from 'electron';
import TorProcess from '../libs/processes/TorProcess';
import { onionDomain } from '../config';
import { app, ipcMain } from '../typed-electron';
import { Module } from './index';
import { getFreePort } from '../libs/getFreePort';
import TrezorConnect from 'trezor-connect';

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

    const setupTor = async (settings: TorSettings) => {
        const shouldRunBundledTor = settings.running;
        if (settings.running !== (await tor.status()).process) {
            if (shouldRunBundledTor === true) {
                await tor.start();
            } else {
                await tor.stop();
            }
        }

        // Start (or stop) routing all communication through tor.
        if (settings.running) {
            setProxy(`socks5://${host}:${port}`);
        } else {
            setProxy('');
        }

        // Notify the renderer.
        mainWindow.webContents.send('tor/status', settings.running);
    };

    ipcMain.on('tor/toggle', async (_: unknown, start: boolean) => {
        logger.info('tor', `Toggling ${start ? 'ON' : 'OFF'}`);
        const settings = persistSettings({ running: start });
        await setupTor(settings);
        // After setupTor we can assume TOR is available so we set the proxy in TrezorConnect
        // This is only required when 'toggle' because when app starts with TOR enable TrezorConnect is
        // correctly set in module trezor-connect-ipc.
        const payload = start
            ? {
                  proxy: `socks://${address}`,
                  useOnionLinks: true,
              }
            : { proxy: '', useOnionLinks: false };

        logger.info('tor', `${start ? 'Enable' : 'Disable'} proxy ${payload.proxy}`);
        await TrezorConnect.setProxy(payload);
    });

    ipcMain.on('tor/set-address', async (_: unknown, address: string) => {
        if (store.getTorSettings().address !== address) {
            logger.debug('tor', `Changed address to ${address}`);
            const settings = persistSettings({ address });
            await setupTor(settings);
        }
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

    await setupTor(store.getTorSettings());
};

export default init;
