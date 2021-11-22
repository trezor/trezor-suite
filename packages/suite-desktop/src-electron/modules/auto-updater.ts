/**
 * Auto Updater feature (notify, download, install)
 */

import { unlinkSync } from 'fs';
import { app, ipcMain } from 'electron';
import {
    autoUpdater,
    CancellationToken,
    UpdateInfo,
    UpdateDownloadedEvent,
} from 'electron-updater';

import { isDev } from '@suite-utils/build';
import { b2t } from '@desktop-electron/libs/utils';
import { verifySignature } from '@desktop-electron/libs/update-checker';
import { toHumanReadable } from '@suite-utils/file';
import { isEnabled } from '@suite-utils/features';

// Runtime flags
const enableUpdater = app.commandLine.hasSwitch('enable-updater');
const disableUpdater = app.commandLine.hasSwitch('disable-updater');
const preReleaseFlag = app.commandLine.hasSwitch('pre-release');

const init = ({ mainWindow, store }: Dependencies) => {
    const { logger } = global;
    if (!isEnabled('DESKTOP_AUTO_UPDATER') && !enableUpdater) {
        logger.info('auto-updater', 'Disabled via feature flag');
        return;
    }

    if (isEnabled('DESKTOP_AUTO_UPDATER') && disableUpdater) {
        logger.info('auto-updater', 'Disabled via command line parameter');
        return;
    }

    // If APPIMAGE is not set on Linux, the auto updater can't handle that
    if (process.platform === 'linux' && process.env.APPIMAGE === undefined && !isDev) {
        logger.warn('auto-updater', 'APPIMAGE is not defined, skipping auto updater');
        return;
    }

    // Enable feature on FE once it's ready
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('update/allow-prerelease', autoUpdater.allowPrerelease);
        mainWindow.webContents.send('update/enable');

        // if there is savedCurrentVersion in store (it doesn't have to be there as it was added in later versions)
        // and if it does not match current application version it means that application got updated and the new version
        // is run for the first time.
        const updateSettings = store.getUpdateSettings();
        const { savedCurrentVersion } = updateSettings;
        const currentVersion = app.getVersion();
        logger.debug(
            'auto-updater',
            `version of application before this launch: ${savedCurrentVersion}, current app version: ${currentVersion}`,
        );
        if (savedCurrentVersion && savedCurrentVersion !== currentVersion) {
            mainWindow.webContents.send('update/new-version-first-run', currentVersion);
        }
        // save current app version so that after app is relaunched we can show info about transition to the new version
        store.setUpdateSettings({
            ...updateSettings,
            savedCurrentVersion: currentVersion,
        });
    });

    let isManualCheck = false;
    let latestVersion: Partial<UpdateInfo> = {};
    let updateCancellationToken: CancellationToken;
    let shouldInstallUpdateOnQuit = false;

    // Prevent downloading an update unless user explicitly asks for it.
    autoUpdater.autoDownload = false;
    // Manually force install based on `shouldInstallUpdateOnQuit` var instead to have more control over the process.
    // This is useful for cases when we want to cancel update after it has started. It seems to work in the current version
    // of electron-updater only until update-downloaded event is emitted.
    autoUpdater.autoInstallOnAppQuit = false;

    const updateSettings = store.getUpdateSettings();
    autoUpdater.allowPrerelease = preReleaseFlag || updateSettings.allowPrerelease;
    mainWindow.webContents.send('update/allow-prerelease', autoUpdater.allowPrerelease);

    autoUpdater.logger = null;

    const quitAndInstall = () => {
        // Removing listeners & closing window (https://github.com/electron-userland/electron-builder/issues/1604)
        app.removeAllListeners('window-all-closed');
        mainWindow.removeAllListeners('close');
        mainWindow.close();

        autoUpdater.quitAndInstall();
    };

    logger.info(
        'auto-updater',
        `Is looking for pre-releases? (${b2t(autoUpdater.allowPrerelease)})`,
    );

    autoUpdater.on('checking-for-update', () => {
        logger.info('auto-updater', 'Checking for update');
        mainWindow.webContents.send('update/checking');
    });

    autoUpdater.on('update-available', updateInfo => {
        const { version, releaseDate, files } = updateInfo;

        logger.warn('auto-updater', [
            'Update is available:',
            `- Update version: ${version}`,
            `- Release date: ${releaseDate}`,
            `- Manual check: ${b2t(isManualCheck)}`,
        ]);

        latestVersion = { version, releaseDate, files };
        mainWindow.webContents.send('update/available', { ...latestVersion, isManualCheck });

        // Reset manual check flag
        isManualCheck = false;
    });

    autoUpdater.on('update-not-available', ({ version, releaseDate }) => {
        logger.info('auto-updater', [
            'No new update is available:',
            `- Last version: ${version}`,
            `- Last release date: ${releaseDate}`,
            `- Manual check: ${b2t(isManualCheck)}`,
        ]);

        latestVersion = { version, releaseDate };
        mainWindow.webContents.send('update/not-available', { ...latestVersion, isManualCheck });

        // Reset manual check flag
        isManualCheck = false;
    });

    autoUpdater.on('error', err => {
        logger.error('auto-updater', `An error happened: ${err.toString()}`);
        mainWindow.webContents.send('update/error', err);
    });

    autoUpdater.on('download-progress', progressObj => {
        logger.debug(
            'auto-updater',
            `Downloading ${progressObj.percent}% (${toHumanReadable(
                progressObj.transferred,
            )}/${toHumanReadable(progressObj.total)})`,
        );
        mainWindow.webContents.send('update/downloading', { ...progressObj });
    });

    autoUpdater.on('update-downloaded', (info: UpdateDownloadedEvent) => {
        const { version, releaseDate, downloadedFile } = info;

        logger.info('auto-updater', [
            'Update downloaded:',
            `- Last version: ${version}`,
            `- Last release date: ${releaseDate}`,
            `- Downloaded file: ${downloadedFile}`,
        ]);

        mainWindow.webContents.send('update/downloading', { verifying: true });

        verifySignature(version, downloadedFile)
            .then(() => {
                logger.info('auto-updater', 'Signature of update is valid');

                mainWindow.webContents.send('update/downloaded', {
                    version,
                    releaseDate,
                    downloadedFile,
                });

                shouldInstallUpdateOnQuit = true;
            })
            .catch(err => {
                logger.error('auto-updater', `Signature check failed: ${err.message}`);

                mainWindow.webContents.send('update/error', err);

                logger.info('auto-updater', `Unlink downloaded file ${downloadedFile}`);

                // Delete file so we are sure it's not accidentally installed
                unlinkSync(downloadedFile);

                shouldInstallUpdateOnQuit = false;
            })
            .finally(() => {
                logger.info(
                    'auto-updater',
                    `Is configured to auto update after app quit ${shouldInstallUpdateOnQuit}`,
                );
            });
    });

    autoUpdater.on('before-quit-for-update', () => {
        logger.info('auto-updater', 'before-quit-for-update event');
    });

    ipcMain.on('update/check', (_, isManual?: boolean) => {
        if (isManual) {
            isManualCheck = true;
        }

        logger.info('auto-updater', `Update checking request (manual: ${b2t(isManualCheck)})`);
        autoUpdater.checkForUpdates();
    });

    ipcMain.on('update/download', () => {
        logger.info('auto-updater', 'Download requested');

        mainWindow.webContents.send('update/downloading', {
            percent: 0,
            bytesPerSecond: 0,
            total: 0,
            transferred: 0,
        });

        updateCancellationToken = new CancellationToken();
        autoUpdater
            .downloadUpdate(updateCancellationToken)
            .then(() => logger.info('auto-updater', 'Update downloaded'))
            .catch(() => {
                logger.info('auto-updater', 'Update cancelled');
            });
    });

    ipcMain.on('update/install', () => {
        logger.info('auto-updater', 'Installation request');

        quitAndInstall();
    });

    ipcMain.on('update/cancel', () => {
        logger.info('auto-updater', 'Cancel update request');
        mainWindow.webContents.send('update/available', latestVersion);
        updateCancellationToken.cancel();
    });

    ipcMain.on('update/allow-prerelease', (_, value = true) => {
        logger.info('auto-updater', `${value ? 'allow' : 'disable'} prerelease!`);
        mainWindow.webContents.send('update/allow-prerelease', value);
        const updateSettings = store.getUpdateSettings();
        store.setUpdateSettings({ ...updateSettings, allowPrerelease: value });

        autoUpdater.allowPrerelease = value;
    });

    app.on('before-quit', () => {
        if (shouldInstallUpdateOnQuit) {
            quitAndInstall();
        }
    });
};

export default init;
