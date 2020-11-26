/**
 * Tor feature (toggle, configure)
 */
import { app, session, ipcMain, BrowserWindow, IpcMainEvent } from 'electron';

import TorProcess from '@lib/processes/TorProcess';

import { onionDomain } from '../config';

const tor = new TorProcess();

const torFlag = app.commandLine.hasSwitch('tor');

const init = async (window: BrowserWindow, store: LocalStore) => {
    const torSettings = store.getTorSettings();

    const toggleTor = async (start: boolean) => {
        if (start) {
            if (torSettings.running) {
                await tor.restart();
            } else {
                await tor.start();
            }
        } else {
            await tor.stop();
        }

        torSettings.running = start;
        store.setTorSettings(torSettings);

        window.webContents.send('tor/status', start);
        session.defaultSession.setProxy({
            proxyRules: start ? `socks5://${torSettings.address}` : '',
        });
    };

    if (torFlag || torSettings.running) {
        await toggleTor(true);
    }

    ipcMain.on('tor/toggle', async (_, start: boolean) => {
        await toggleTor(start);
    });

    ipcMain.on('tor/set-address', () => async (_: IpcMainEvent, address: string) => {
        if (torSettings.address !== address) {
            torSettings.address = address;
            store.setTorSettings(torSettings);

            if (torSettings.running) {
                await toggleTor(true);
            }
        }
    });

    ipcMain.on('tor/get-status', () => {
        window.webContents.send('tor/status', torSettings.running);
    });

    ipcMain.handle('tor/get-address', () => {
        return torSettings.address;
    });

    session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, cb) => {
        const { hostname, protocol } = new URL(details.url);

        // Redirect outgoing trezor.io requests to .onion domain
        if (torSettings.running && hostname.endsWith('trezor.io') && protocol === 'https:') {
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
