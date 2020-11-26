/**
 * Auto Updater feature (notify, download, install)
 */

import { app, ipcMain, BrowserWindow } from 'electron';
import { autoUpdater, CancellationToken } from 'electron-updater';

// Runtime flags
const preReleaseFlag = app.commandLine.hasSwitch('pre-release');

const updateCancellationToken = new CancellationToken();

const init = (window: BrowserWindow, store: LocalStore) => {
    let latestVersion = {};
    const updateSettings = store.getUpdateSettings();

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = preReleaseFlag;

    if (updateSettings.skipVersion) {
        window.webContents.send('update/skip', updateSettings.skipVersion);
    }

    autoUpdater.on('checking-for-update', () => {
        window.webContents.send('update/checking');
    });

    autoUpdater.on('update-available', ({ version, releaseDate }) => {
        latestVersion = { version, releaseDate };
        if (updateSettings.skipVersion === version) {
            return;
        }

        window.webContents.send('update/available', latestVersion);
    });

    autoUpdater.on('update-not-available', ({ version, releaseDate }) => {
        latestVersion = { version, releaseDate };
        window.webContents.send('update/not-available', latestVersion);
    });

    autoUpdater.on('error', err => {
        window.webContents.send('update/error', err);
    });

    autoUpdater.on('download-progress', progressObj => {
        window.webContents.send('update/downloading', { ...progressObj });
    });

    autoUpdater.on('update-downloaded', ({ version, releaseDate, downloadedFile }) => {
        window.webContents.send('update/downloaded', { version, releaseDate, downloadedFile });
    });

    ipcMain.on('update/check', () => autoUpdater.checkForUpdates());
    ipcMain.on('update/download', () => {
        window.webContents.send('update/downloading', {
            percent: 0,
            bytesPerSecond: 0,
            total: 0,
            transferred: 0,
        });
        autoUpdater.downloadUpdate(updateCancellationToken);
    });
    ipcMain.on('update/install', () => {
        // This will force the closing of the window to quit the app on Mac
        global.quitOnWindowClose = true;
        // https://www.electron.build/auto-update#module_electron-updater.AppUpdater+quitAndInstall
        // appUpdater.quitAndInstall(isSilent, isForceRunAfter)
        // isSilent (windows): Runs the installer in silent mode
        // isForceRunAfter (windows): Run the app after finish even on silent install
        autoUpdater.quitAndInstall(true, true);
    });
    ipcMain.on('update/cancel', () => {
        window.webContents.send('update/available', latestVersion);
        updateCancellationToken.cancel();
    });
    ipcMain.on('update/skip', (_, version) => {
        window.webContents.send('update/skip', version);
        updateSettings.skipVersion = version;
        store.setUpdateSettings(updateSettings);
    });
};

export default init;
