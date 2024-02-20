import { unlinkSync } from 'fs';
import {
    autoUpdater,
    CancellationToken,
    UpdateInfo,
    UpdateDownloadedEvent,
    ProgressInfo,
} from 'electron-updater';

import { bytesToHumanReadable } from '@trezor/utils';
import { isFeatureFlagEnabled, isDevEnv } from '@suite-common/suite-utils';

import { app, ipcMain } from '../typed-electron';
import { b2t } from '../libs/utils';
import { verifySignature } from '../libs/update-checker';
import { getReleaseNotes } from '../libs/github';

import type { Module } from './index';

// Runtime flags
const enableUpdater = app.commandLine.hasSwitch('enable-updater');
const disableUpdater = app.commandLine.hasSwitch('disable-updater');
const preReleaseFlag = app.commandLine.hasSwitch('pre-release');
const feedURL = app.commandLine.getSwitchValue('updater-url');

export const SERVICE_NAME = 'auto-updater';

export const init: Module = ({ mainWindow, store }) => {
    const { logger } = global;
    if (!isFeatureFlagEnabled('DESKTOP_AUTO_UPDATER') && !enableUpdater) {
        logger.info(SERVICE_NAME, 'Disabled via feature flag');

        return;
    }

    if (isFeatureFlagEnabled('DESKTOP_AUTO_UPDATER') && disableUpdater) {
        logger.info(SERVICE_NAME, 'Disabled via command line parameter');

        return;
    }

    // If APPIMAGE is not set on Linux, the auto updater can't handle that
    if (process.platform === 'linux' && process.env.APPIMAGE === undefined && !isDevEnv) {
        logger.warn(SERVICE_NAME, 'APPIMAGE is not defined, skipping auto updater');

        return;
    }

    let isManualCheck = false;
    let updateCancellationToken: CancellationToken;

    // Prevent downloading an update unless user explicitly asks for it.
    autoUpdater.autoDownload = false;

    const updateSettings = store.getUpdateSettings();
    autoUpdater.allowPrerelease = preReleaseFlag || updateSettings.allowPrerelease;

    autoUpdater.logger = null;

    if (feedURL) {
        autoUpdater.setFeedURL(feedURL);
        logger.warn(SERVICE_NAME, [`Feed url: ${feedURL}`]);
    }

    logger.info(SERVICE_NAME, `Is looking for pre-releases? (${b2t(autoUpdater.allowPrerelease)})`);

    autoUpdater.on('checking-for-update', () => {
        logger.info(SERVICE_NAME, 'Checking for update');
        mainWindow.webContents.send('update/checking');
    });

    autoUpdater.on(
        'update-available',
        async ({ version, releaseDate, releaseNotes }: UpdateInfo) => {
            let release;
            try {
                release = feedURL
                    ? { prerelease: false, body: releaseNotes?.toString() }
                    : await getReleaseNotes(version);
            } catch (error) {
                logger.error(SERVICE_NAME, 'Fetching release notes failed!');
            } finally {
                logger.warn(SERVICE_NAME, [
                    'Update is available:',
                    `- Update version: ${version}`,
                    `- Prerelease: ${release?.prerelease}`,
                    `- Changelog: ${release?.body ? 'available' : 'unavailable'}`,
                    `- Release date: ${releaseDate}`,
                    `- Manual check: ${b2t(isManualCheck)}`,
                ]);

                mainWindow.webContents.send('update/available', {
                    version,
                    releaseDate,
                    isManualCheck,
                    prerelease: release?.prerelease,
                    changelog: release?.body,
                });

                // Reset manual check flag
                isManualCheck = false;
            }
        },
    );

    autoUpdater.on('update-not-available', ({ version, releaseDate }: UpdateInfo) => {
        logger.info(SERVICE_NAME, [
            'No new update is available:',
            `- Last version: ${version}`,
            `- Last release date: ${releaseDate}`,
            `- Manual check: ${b2t(isManualCheck)}`,
        ]);

        mainWindow.webContents.send('update/not-available', {
            version,
            releaseDate,
            isManualCheck,
        });

        // Reset manual check flag
        isManualCheck = false;
    });

    autoUpdater.on('error', (err: Error) => {
        logger.error(SERVICE_NAME, `An error happened: ${err.toString()}`);
        mainWindow.webContents.send('update/error', err);
    });

    autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
        logger.debug(
            SERVICE_NAME,
            `Downloading ${progressObj.percent}% (${bytesToHumanReadable(
                progressObj.transferred,
            )}/${bytesToHumanReadable(progressObj.total)})`,
        );
        mainWindow.webContents.send('update/downloading', progressObj);
    });

    autoUpdater.on('update-downloaded', async (info: UpdateDownloadedEvent) => {
        const { version, releaseDate, downloadedFile, releaseNotes } = info;

        logger.info(SERVICE_NAME, [
            'Update downloaded:',
            `- Last version: ${version}`,
            `- Last release date: ${releaseDate}`,
            `- Downloaded file: ${downloadedFile}`,
            `- Release notes: ${releaseNotes}`,
        ]);

        mainWindow.webContents.send('update/downloading', { verifying: true });

        try {
            // check downloaded file
            await verifySignature({
                version,
                downloadedFile,
                feedURL,
            });

            logger.info(SERVICE_NAME, 'Signature of update file is valid');

            mainWindow.webContents.send('update/downloaded', {
                version,
                releaseDate,
                downloadedFile,
            });
        } catch (err) {
            autoUpdater.autoInstallOnAppQuit = false;
            unlinkSync(downloadedFile);
            mainWindow.webContents.send('update/error', err);

            logger.error(SERVICE_NAME, `Signature check of update file failed: ${err.message}`);
            logger.info(SERVICE_NAME, `Unlink downloaded file ${downloadedFile}`);
        }

        logger.info(
            SERVICE_NAME,
            `Is configured to auto update after app quit? ${autoUpdater.autoInstallOnAppQuit}`,
        );
    });

    ipcMain.on('update/check', (_, isManual) => {
        if (isManual) {
            isManualCheck = true;
        }

        logger.info(SERVICE_NAME, `Update checking request (manual: ${b2t(isManualCheck)})`);
        autoUpdater.checkForUpdates();
    });

    ipcMain.on('update/download', async () => {
        logger.info(SERVICE_NAME, 'Download requested');

        mainWindow.webContents.send('update/downloading', {
            percent: 0,
            bytesPerSecond: 0,
            total: 0,
            transferred: 0,
        });

        updateCancellationToken = new CancellationToken();

        try {
            await autoUpdater.downloadUpdate(updateCancellationToken);
            logger.info(SERVICE_NAME, 'Update downloaded');
        } catch {
            logger.info(SERVICE_NAME, 'Update cancelled');
        }
    });

    ipcMain.on('update/install', () => {
        logger.info(SERVICE_NAME, 'Restart and update request');

        setImmediate(() => {
            // Removing listeners & closing window (https://github.com/electron-userland/electron-builder/issues/1604)
            app.removeAllListeners('window-all-closed');
            mainWindow.removeAllListeners('close');
            mainWindow.close();

            // Silent install on Windows to match on "Update on quit" and MacOS behavior
            autoUpdater.quitAndInstall(true, true);
        });
    });

    ipcMain.on('update/cancel', () => {
        logger.info(
            SERVICE_NAME,
            `Cancel update request (in progress: ${b2t(!!updateCancellationToken)})`,
        );
        if (updateCancellationToken) {
            updateCancellationToken.cancel();
        }
    });

    ipcMain.on('update/allow-prerelease', (_, value = true) => {
        logger.info(SERVICE_NAME, `${value ? 'allow' : 'disable'} prerelease!`);
        mainWindow.webContents.send('update/allow-prerelease', value);
        const settings = store.getUpdateSettings();
        store.setUpdateSettings({ ...settings, allowPrerelease: value });

        autoUpdater.allowPrerelease = value;
    });

    // Enable feature on FE once it's ready
    return () => {
        // if there is savedCurrentVersion in store (it doesn't have to be there as it was added in later versions)
        // and if it does not match current application version it means that application got updated and the new version
        // is run for the first time.
        const settings = store.getUpdateSettings();
        const { savedCurrentVersion } = settings;
        const currentVersion = app.getVersion();
        logger.debug(
            SERVICE_NAME,
            `Version of application before this launch: ${savedCurrentVersion}, current app version: ${currentVersion}`,
        );

        // save current app version so that after app is relaunched we can show info about transition to the new version
        store.setUpdateSettings({
            ...updateSettings,
            savedCurrentVersion: currentVersion,
        });

        return {
            allowPrerelease: autoUpdater.allowPrerelease,
            firstRun:
                savedCurrentVersion && savedCurrentVersion !== currentVersion
                    ? currentVersion
                    : undefined,
        };
    };
};
