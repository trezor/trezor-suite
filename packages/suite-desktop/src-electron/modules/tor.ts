/**
 * Tor feature (toggle, configure)
 */
import { app, session, ipcMain, IpcMainEvent } from 'electron';

import TorProcess from '@desktop-electron/libs/processes/TorProcess';
import { b2t } from '@desktop-electron/libs/utils';

import { onionDomain } from '../config';

const torFlag = app.commandLine.hasSwitch('tor');

const init = async ({ mainWindow, store }: Dependencies) => {
    const { logger } = global;
    const tor = new TorProcess();
    const torSettings = store.getTorSettings();

    const toggleTor = async (start: boolean) => {
        if (start) {
            if (torSettings.running) {
                logger.info('tor', 'Restarting');
                await tor.restart();
            } else {
                logger.info('tor', 'Starting');
                await tor.start();
            }
        } else {
            logger.info('tor', 'Stopping');
            await tor.stop();
        }

        torSettings.running = start;
        store.setTorSettings(torSettings);

        mainWindow.webContents.send('tor/status', start);

        const proxy = start ? `socks5://${torSettings.address}` : '';
        logger.info('tor', `Setting proxy to "${proxy}"`);
        session.defaultSession.setProxy({
            proxyRules: proxy,
        });
    };

    if (torFlag || torSettings.running) {
        logger.info('tor', [
            'Auto starting:',
            `- Running with flag: ${b2t(torFlag)}`,
            `- Running with settings: ${b2t(torSettings.running)}`,
        ]);
        await toggleTor(true);
    }

    ipcMain.on('tor/toggle', async (_, start: boolean) => {
        logger.info('tor', `Toggling ${start ? 'ON' : 'OFF'}`);
        await toggleTor(start);
    });

    ipcMain.on('tor/set-address', () => async (_: IpcMainEvent, address: string) => {
        if (torSettings.address !== address) {
            logger.debug('tor', [
                'Updating address:',
                `- From: ${torSettings.address}`,
                `- To: ${address}`,
            ]);

            torSettings.address = address;
            store.setTorSettings(torSettings);

            if (torSettings.running) {
                await toggleTor(true);
            }
        }
    });

    ipcMain.on('tor/get-status', () => {
        logger.debug('tor', `Getting status (${torSettings.running ? 'ON' : 'OFF'})`);
        mainWindow.webContents.send('tor/status', torSettings.running);
    });

    ipcMain.handle('tor/get-address', () => {
        logger.debug('tor', `Getting address (${torSettings.address})`);
        return torSettings.address;
    });

    session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, cb) => {
        const { hostname, protocol } = new URL(details.url);

        // Redirect outgoing trezor.io requests to .onion domain
        if (torSettings.running && hostname.endsWith('trezor.io') && protocol === 'https:') {
            logger.info('tor', `Rewriting ${details.url} to .onion URL`);
            cb({
                redirectURL: details.url.replace(
                    /https:\/\/(([a-z0-9]+\.)*)trezor\.io(.*)/,
                    `http://$1${onionDomain}$3`,
                ),
            });
            return;
        }

        cb({ cancel: false });
    });
};

export default init;
