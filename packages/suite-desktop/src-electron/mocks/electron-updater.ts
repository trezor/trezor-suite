import { app } from 'electron';

class CancellationToken {
    cancelled: boolean;

    constructor() {
        this.cancelled = false;
    }

    cancel() {
        this.cancelled = true;
    }
}

type Events =
    | 'checking-for-update'
    | 'update-available'
    | 'update-not-available'
    | 'download-progress'
    | 'update-downloaded'
    | 'error';

const callbacks = {
    'checking-for-update': () => null,
    'update-available': (_args: any) => null,
    'update-not-available': (_args: any) => null,
    'download-progress': (_args: any) => null,
    'update-downloaded': (_args: any) => null,
    error: (_args: any) => null,
};

/**
 * The parameter `--mock-trigger-updater-after=DELAY` will pretend that a new update
 * is available for a given delay. This is disabled by default and can be enabled with
 * any value starting from 0 (available at start) to the delay in seconds before the
 * update should be available.
 */
const triggerUpdateAfter = Number(
    app.commandLine.getSwitchValue('mock-trigger-updater-after') || '-1',
);

let updateAvailable = triggerUpdateAfter === 0;
if (triggerUpdateAfter > 0) {
    setTimeout(() => {
        updateAvailable = true;
    }, 1000 * triggerUpdateAfter);
}

const autoUpdater = {
    autoDownload: true,
    autoInstallOnAppQuit: false,
    allowPreRelease: false,
    on: (event: Events, cb: any) => {
        callbacks[event] = cb;
    },
    checkForUpdates: () => {
        callbacks['checking-for-update']();
        setTimeout(() => {
            if (updateAvailable) {
                callbacks['update-available']({ version: '31.3.37', releaseDate: new Date() });
            } else {
                callbacks['update-not-available']({
                    version: app.getVersion(),
                    releaseDate: new Date(),
                });
            }
        }, 1000);
    },
    downloadUpdate: (cancellationToken: CancellationToken) =>
        new Promise<void>((resolve, reject) => {
            let i = 0;
            const downloadProgress = setInterval(() => {
                if (cancellationToken.cancelled) {
                    clearInterval(downloadProgress);
                    return reject();
                }

                if (i === 20) {
                    clearInterval(downloadProgress);
                    callbacks['update-downloaded']({
                        version: '31.3.37',
                        releaseDate: new Date(),
                        downloadedFile: 'MOCK',
                    });
                    return resolve();
                }

                i++;
                callbacks['download-progress']({
                    percent: 10 * (i / 2),
                    bytesPerSecond: 1024 * 1024,
                    total: 1024 * 1024 * 10,
                    transferred: 1024 * 1024 * (i / 2),
                });
            }, 500);
        }),
    quitAndInstall: () => {
        app.quit();
    },
};

export { autoUpdater, CancellationToken };
