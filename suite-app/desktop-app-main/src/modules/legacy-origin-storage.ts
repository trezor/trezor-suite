/**
 * One-time move of the renderer's browser storage (IndexedDB, localStorage and the origin private
 * file system) from the `file://` origin, which `loadFile('build/index.html')` gave the renderer,
 * to the origin it loads from now (see ../libs/renderer-protocol.ts). Browser storage is keyed by
 * origin and Chromium offers no way to move it, so a hidden window still on `file://` reads
 * everything through its preload and streams it here. The renderer asks for it before it opens
 * its own database, writes it into the new origin and reports back, upon which the old origin is
 * wiped.
 */
import { captureException } from '@sentry/electron/main';
// The export page is not the renderer, so its messages cannot pass the renderer-only sender
// validation that ../ipcMain.ts wraps around every listener; the sender is checked here instead.
/* eslint-disable @typescript-eslint/no-restricted-imports */
import {
    BrowserWindow,
    type IpcMainInvokeEvent,
    app,
    ipcMain as baseIpcMain,
    dialog,
    session,
} from 'electron';
/* eslint-enable @typescript-eslint/no-restricted-imports */
import fs from 'fs';
import path from 'path';

import {
    type LegacyOriginDatabase,
    type LegacyOriginFile,
    type LegacyOriginObjectStore,
    type LegacyOriginStorage,
    legacyOriginExportFailedMessage,
    legacyOriginExportFinishedMessage,
    legacyOriginExportObjectStoreMessage,
    legacyOriginFile,
    legacyOriginStorageImportReport,
} from '@suite/desktop-app-api';
import { isDevEnv } from '@suite-common/suite-utils';
import { type Result, err, ok } from '@trezor/type-utils';
import { createDeferred } from '@trezor/utils';

import { ipcMain } from '../ipcMain';
import type { ModuleInit } from './module';
import { restartApp } from '../libs/app-utils';
import { LEGACY_ORIGIN_EXPORT_CHANNELS } from '../libs/legacy-origin-storage-export';
import type { ILogger } from '../libs/logger';

export const SERVICE_NAME = 'legacy-origin-storage';

const LEGACY_ORIGIN = 'file://';
/** Where Chromium keeps the `file://` origin's IndexedDB; without it there is nothing to move. */
const LEGACY_INDEXED_DB_DIR = path.join('IndexedDB', 'file__0.indexeddb.leveldb');
const EXPORT_PAGE = 'build/legacy-origin-storage.html';
const EXPORT_TIMEOUT_MS = 120_000;
const NOTHING_TO_MOVE = ok(undefined);
/** The buttons of the dialog shown when the move fails, in their order. */
const FAILED_MOVE_CHOICES = ['retry', 'skip', 'quit'] as const;

type LegacyOriginStorageExport = Result<LegacyOriginStorage, string>;

let isMovePending = false;

/**
 * Whether the move of the legacy storage is still to be finished.
 * The renderer shakes hands only after the move, which takes long for a large storage,
 * and it stays on its error screen when the move fails.
 */
export const isLegacyOriginStorageMovePending = () => isMovePending;

type ExportLegacyOriginStorageParams = {
    logger: ILogger;
};

/**
 * Loads the export page hidden, still on `file://`, and collects what its preload sends.
 * A failed export leaves the legacy data as it is, for another try on the next start.
 */
const exportLegacyOriginStorage = ({ logger }: ExportLegacyOriginStorageParams) => {
    const result = createDeferred<LegacyOriginStorageExport>();
    const exportWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, 'legacy-origin-storage-preload.js'),
        },
    });
    const objectStoresByDatabase = new Map<string, Map<string, LegacyOriginObjectStore>>();
    const files: LegacyOriginFile[] = [];
    // Registered as the resources below are created, released once the export settles.
    const cleanups: Array<() => void> = [];
    let isSettled = false;

    const settle = (storageExport: LegacyOriginStorageExport) => {
        if (isSettled) return;
        isSettled = true;
        cleanups.forEach(cleanup => cleanup());
        if (!exportWindow.isDestroyed()) {
            exportWindow.destroy();
        }
        result.resolve(storageExport);
    };

    const fail = (reason: string) => {
        // Destroying the window on settle fails its pending load; that is not a second failure.
        if (isSettled) return;
        logger.error(SERVICE_NAME, `Export failed: ${reason}`);
        captureException(new Error(`${SERVICE_NAME}: export failed: ${reason}`));
        settle(err(reason));
    };

    const isFromExportPage = (event: IpcMainInvokeEvent) =>
        !exportWindow.isDestroyed() &&
        event.sender.id === exportWindow.webContents.id &&
        event.senderFrame?.url === exportWindow.webContents.getURL();

    const handlers: Record<string, (payload: unknown) => void> = {
        [LEGACY_ORIGIN_EXPORT_CHANNELS.objectStore]: payload => {
            const message = legacyOriginExportObjectStoreMessage.safeParse(payload);
            if (!message.success) {
                fail(`invalid object store message: ${message.error.message}`);

                return;
            }
            const { database, objectStore, records } = message.data;
            const objectStores =
                objectStoresByDatabase.get(database.name) ??
                new Map<string, LegacyOriginObjectStore>();
            objectStoresByDatabase.set(database.name, objectStores);
            const slicedObjectStore = objectStores.get(objectStore.name);
            if (slicedObjectStore) {
                slicedObjectStore.records.push(...records);
            } else {
                objectStores.set(objectStore.name, { ...objectStore, records });
            }
        },
        [LEGACY_ORIGIN_EXPORT_CHANNELS.file]: payload => {
            const message = legacyOriginFile.safeParse(payload);
            if (!message.success) {
                fail(`invalid file message: ${message.error.message}`);

                return;
            }
            files.push(message.data);
        },
        [LEGACY_ORIGIN_EXPORT_CHANNELS.finished]: payload => {
            const message = legacyOriginExportFinishedMessage.safeParse(payload);
            if (!message.success) {
                fail(`invalid finished message: ${message.error.message}`);

                return;
            }
            const databases: LegacyOriginDatabase[] = [];
            for (const { name, version, objectStoreNames } of message.data.databases) {
                const objectStores: LegacyOriginObjectStore[] = [];
                for (const storeName of objectStoreNames) {
                    const objectStore = objectStoresByDatabase.get(name)?.get(storeName);
                    if (!objectStore) {
                        fail(`the database ${name} is missing the object store ${storeName}`);

                        return;
                    }
                    objectStores.push(objectStore);
                }
                databases.push({ name, version, objectStores });
            }
            settle(ok({ databases, localStorage: message.data.localStorage, files }));
        },
        [LEGACY_ORIGIN_EXPORT_CHANNELS.failed]: payload => {
            const message = legacyOriginExportFailedMessage.safeParse(payload);
            fail(message.success ? message.data.error : 'unknown error');
        },
    };

    Object.entries(handlers).forEach(([channel, handler]) => {
        baseIpcMain.handle(channel, (event, payload) => {
            if (!isFromExportPage(event)) {
                throw new Error(`${channel}: unexpected sender`);
            }
            handler(payload);
        });
        cleanups.push(() => baseIpcMain.removeHandler(channel));
    });

    const timeout = setTimeout(
        () => fail(`timed out after ${EXPORT_TIMEOUT_MS} ms`),
        EXPORT_TIMEOUT_MS,
    );
    cleanups.push(() => clearTimeout(timeout));
    exportWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) =>
        fail(`the export page failed to load: ${errorDescription} (${errorCode})`),
    );
    exportWindow.webContents.on('render-process-gone', (_event, details) =>
        fail(`the export page's renderer is gone: ${details.reason}`),
    );
    exportWindow
        .loadFile(EXPORT_PAGE)
        .catch(error => fail(`cannot load the export page: ${error.message}`));

    return result.promise;
};

export const init: ModuleInit = ({ mainWindowProxy, store, logger }) => {
    let pendingExport: Promise<Result<LegacyOriginStorage | undefined, string>> =
        Promise.resolve(NOTHING_TO_MOVE);

    const markMigrated = () => {
        isMovePending = false;
        store.setLegacyOriginStorageSettings({ isMigrated: true });
    };

    let isFailedMoveDialogOpen = false;

    /**
     * The renderer stops on its error screen when the move fails, and only a restart tries the move again.
     * A failure that comes back on every start would keep the app unusable,
     * so the user may also start without the old data, which then stays on the legacy origin untouched.
     */
    const offerWayPastFailedMove = async (reason: string) => {
        const mainWindow = mainWindowProxy.getInstance();
        if (!mainWindow || isFailedMoveDialogOpen) return;

        isFailedMoveDialogOpen = true;
        const { response } = await dialog.showMessageBox(mainWindow, {
            type: 'error',
            message: 'Moving the app data failed',
            detail: `${reason}\n\nTry again, or start without the data of the previous version. That data stays on this computer, but the app will not try to move it again.`,
            buttons: ['Try again', 'Start without the old data', 'Quit'],
            defaultId: 0,
            cancelId: 0,
        });
        isFailedMoveDialogOpen = false;

        const choice = FAILED_MOVE_CHOICES[response] ?? 'retry';
        if (choice === 'quit') {
            app.quit();

            return;
        }
        if (choice === 'skip') {
            logger.warn(
                SERVICE_NAME,
                'Starting without the legacy storage, it stays on the legacy origin',
            );
            markMigrated();
        }
        restartApp({ logger });
    };

    const hasLegacyStorage = fs.existsSync(
        path.join(app.getPath('userData'), LEGACY_INDEXED_DB_DIR),
    );

    if (!isDevEnv && hasLegacyStorage && !store.getLegacyOriginStorageSettings().isMigrated) {
        const exportResult = createDeferred<LegacyOriginStorageExport>();
        pendingExport = exportResult.promise;
        isMovePending = true;
        // Only once the main window exists: the hidden export window must never be the first
        // window of the app, which is the one tooling such as Playwright's `firstWindow()` attaches to.
        mainWindowProxy.once('init', () => {
            logger.info(SERVICE_NAME, 'Storage of the legacy file:// origin found, exporting it');
            exportLegacyOriginStorage({ logger }).then(exportResult.resolve);
        });
    }

    ipcMain.handle('legacy-origin-storage/pull', async () => {
        const storageExport = await pendingExport;
        /**
         * The renderer must not start on its empty origin now:
         * the database it would create there makes the next start skip the import,
         * as if the user already lived on the new origin.
         */
        if (!storageExport.success) {
            offerWayPastFailedMove(storageExport.error);

            return { success: false, error: storageExport.error };
        }

        const storage = storageExport.payload;
        if (!storage) return { success: true };

        const isEmpty =
            storage.databases.length === 0 &&
            Object.keys(storage.localStorage).length === 0 &&
            storage.files.length === 0;
        if (isEmpty) {
            logger.info(SERVICE_NAME, 'The legacy origin holds no data, nothing to move');
            pendingExport = Promise.resolve(NOTHING_TO_MOVE);
            markMigrated();

            return { success: true };
        }

        logger.info(
            SERVICE_NAME,
            `Handing ${storage.databases.length} database(s) and ${storage.files.length} file(s) to the renderer`,
        );

        return { success: true, payload: storage };
    });

    ipcMain.handle('legacy-origin-storage/report-import', async (_, payload) => {
        const parsedReport = legacyOriginStorageImportReport.safeParse(payload);
        if (!parsedReport.success) {
            logger.error(SERVICE_NAME, `Invalid import report: ${parsedReport.error.message}`);

            return;
        }

        const report = parsedReport.data;
        if (!report.success) {
            // The export is kept, so a reload of the renderer can try the import again.
            logger.error(SERVICE_NAME, `Import failed in the renderer: ${report.error}`);
            captureException(new Error(`${SERVICE_NAME}: import failed: ${report.error}`));
            offerWayPastFailedMove(report.error);

            return;
        }

        // Free the export; a reload of the renderer must not import it a second time.
        pendingExport = Promise.resolve(NOTHING_TO_MOVE);

        if (report.isImported) {
            await session.defaultSession.clearStorageData({
                origin: LEGACY_ORIGIN,
                storages: ['indexdb', 'localstorage', 'filesystem'],
            });
            logger.info(
                SERVICE_NAME,
                'Storage moved to the renderer origin, legacy origin cleared',
            );
        } else {
            logger.warn(
                SERVICE_NAME,
                'The renderer origin already had a database, the legacy data stays untouched',
            );
        }
        markMigrated();
    });
};
