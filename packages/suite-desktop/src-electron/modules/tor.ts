/**
 * Tor feature (toggle, configure)
 */
import { app, session, ipcMain } from 'electron';
import TorProcess, { DEFAULT_ADDRESS } from '@desktop-electron/libs/processes/TorProcess';
import { onionDomain } from '../config';

const init = async ({ mainWindow, store, interceptor }: Dependencies) => {
    const { logger } = global;
    const tor = new TorProcess();

    /**
     * Merges given TorSettings with settings already present in the store,
     * persists the result and returns it.
     */
    const persistSettings = (options: Partial<TorSettings>): TorSettings => {
        const newSettings = { ...store.getTorSettings(), ...options };
        store.setTorSettings(newSettings);
        return newSettings;
    };

    const setProxy = (rule: string) => {
        logger.info('tor', `Setting proxy rules to "${rule}"`);
        session.defaultSession.setProxy({
            proxyRules: rule,
        });
    };

    const setupTor = async (settings: TorSettings) => {
        // Start (or stop) the bundled tor only if address is the default one.
        // Otherwise the user must run the process themselves.
        const shouldRunBundledTor = settings.running && settings.address === DEFAULT_ADDRESS;
        if (shouldRunBundledTor !== (await tor.status()).process) {
            if (shouldRunBundledTor === true) {
                await tor.start();
            } else {
                await tor.stop();
            }
        }

        // Start (or stop) routing all communication through tor.
        if (settings.running) {
            setProxy(`socks5://${settings.address}`);
        } else {
            setProxy('');
        }

        // Notify the renderer.
        mainWindow.webContents.send('tor/status', settings.running);
    };

    ipcMain.on('tor/toggle', async (_, start: boolean) => {
        logger.info('tor', `Toggling ${start ? 'ON' : 'OFF'}`);
        const settings = persistSettings({ running: start });
        await setupTor(settings);
    });

    ipcMain.on('tor/set-address', async (_, address: string) => {
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
            return Promise.resolve({
                redirectURL: details.url.replace(
                    /https:\/\/(([a-z0-9]+\.)*)trezor\.io(.*)/,
                    `http://$1${onionDomain}$3`,
                ),
            });
        }
        return Promise.resolve(undefined);
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
