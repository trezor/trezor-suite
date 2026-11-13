import { app, dialog, session } from 'electron';
import fs from 'fs';

import { init } from './legacy-origin-storage';
import type { Dependencies } from './module';
import { restartApp } from '../libs/app-utils';
import type { ILogger } from '../libs/logger';
import { MainWindowProxy } from '../libs/main-window-proxy';
import type { Store } from '../libs/store';
import type { StrictBrowserWindow } from '../typed-electron';

type IpcHandler = (ipcEvent: never, payload?: unknown) => Promise<unknown>;
type WindowListener = (...args: unknown[]) => void;

const mockIpcHandlers = new Map<string, IpcHandler>();
const mockExportWindowListeners: Array<Map<string, WindowListener>> = [];

const mockCreateExportWindow = () => {
    const listeners = new Map<string, WindowListener>();
    mockExportWindowListeners.push(listeners);
    let isDestroyed = false;

    return {
        webContents: {
            id: 2,
            on: (event: string, listener: WindowListener) => listeners.set(event, listener),
            getURL: () => 'file:///app/build/legacy-origin-storage.html',
        },
        isDestroyed: () => isDestroyed,
        destroy: () => {
            isDestroyed = true;
        },
        // Never settles: each test fails the load itself.
        loadFile: () => new Promise(() => {}),
    };
};

jest.mock('electron', () => ({
    BrowserWindow: jest.fn(() => mockCreateExportWindow()),
    app: { getPath: () => '/user-data', quit: jest.fn() },
    dialog: { showMessageBox: jest.fn() },
    ipcMain: { handle: jest.fn(), removeHandler: jest.fn() },
    session: { defaultSession: { clearStorageData: jest.fn() } },
}));

jest.mock('@sentry/electron/main', () => ({ captureException: jest.fn() }));

jest.mock('@suite-common/suite-utils', () => ({
    ...jest.requireActual('@suite-common/suite-utils'),
    isDevEnv: false,
}));

jest.mock('../ipcMain', () => ({
    ipcMain: {
        handle: (channel: string, handler: IpcHandler) => {
            mockIpcHandlers.set(channel, handler);
        },
    },
}));

jest.mock('../libs/app-utils', () => ({ restartApp: jest.fn() }));

const FAILED_MOVE_RESPONSES = { retry: 0, skip: 1, quit: 2 };

const createLogger = (): ILogger => ({
    level: 'mute',
    config: {
        colors: false,
        writeToConsole: false,
        writeToDisk: false,
        outputFile: '',
        outputPath: '',
        logFormat: '',
        dedupeTimeout: 0,
        memoryCap: 0,
    },
    exit: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    getLog: jest.fn(() => []),
});

const createStore = () => ({
    getLegacyOriginStorageSettings: jest.fn(() => ({ isMigrated: false })),
    setLegacyOriginStorageSettings: jest.fn(),
});

const createMainWindow = () => ({
    isDestroyed: () => false,
    webContents: { isDestroyed: () => false },
});

/** Starts the module with legacy storage on disk and opens the main window, which starts the export. */
const startWithLegacyStorage = () => {
    const store = createStore();
    const mainWindowProxy = new MainWindowProxy();
    const deps: Dependencies = {
        mainWindowProxy,
        // The real store is a file-backed singleton; the module reads and writes only these settings.
        store: store as unknown as Store,
        interceptor: { onBeforeRequest: jest.fn(), offBeforeRequest: jest.fn() },
        // Neither is used by the module.
        mainThreadEmitter: {} as Dependencies['mainThreadEmitter'],
        powerSaveBlocker: {} as Dependencies['powerSaveBlocker'],
        cspNonce: 'nonce',
        logger: createLogger(),
    };

    init(deps);
    mainWindowProxy.setInstance(createMainWindow() as unknown as StrictBrowserWindow);

    return { store };
};

const getHandler = (channel: string) => {
    const handler = mockIpcHandlers.get(channel);
    if (!handler) throw new Error(`${channel} was not handled`);

    return handler;
};

const failExportPageLoad = () => {
    const listeners = mockExportWindowListeners[mockExportWindowListeners.length - 1];
    listeners?.get('did-fail-load')?.({}, -6, 'ERR_FILE_NOT_FOUND');
};

const settleDialog = () => new Promise(resolve => setImmediate(resolve));

describe('legacy-origin-storage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIpcHandlers.clear();
        mockExportWindowListeners.length = 0;
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    });

    it('offers to start without the old data when the export fails, and keeps that data', async () => {
        jest.mocked(dialog.showMessageBox).mockResolvedValue({
            response: FAILED_MOVE_RESPONSES.skip,
            checkboxChecked: false,
        });
        const { store } = startWithLegacyStorage();
        failExportPageLoad();

        const pulled = await getHandler('legacy-origin-storage/pull')({} as never);
        await settleDialog();

        expect(pulled).toEqual({
            success: false,
            error: expect.stringContaining('ERR_FILE_NOT_FOUND'),
        });
        expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
        expect(store.setLegacyOriginStorageSettings).toHaveBeenCalledWith({ isMigrated: true });
        expect(session.defaultSession.clearStorageData).not.toHaveBeenCalled();
        expect(restartApp).toHaveBeenCalledTimes(1);
    });

    it('tries the move again on the next start when the user asks to', async () => {
        jest.mocked(dialog.showMessageBox).mockResolvedValue({
            response: FAILED_MOVE_RESPONSES.retry,
            checkboxChecked: false,
        });
        const { store } = startWithLegacyStorage();
        failExportPageLoad();

        await getHandler('legacy-origin-storage/pull')({} as never);
        await settleDialog();

        expect(store.setLegacyOriginStorageSettings).not.toHaveBeenCalled();
        expect(restartApp).toHaveBeenCalledTimes(1);
    });

    it('asks once while the question is open, however often the renderer pulls', async () => {
        jest.mocked(dialog.showMessageBox).mockReturnValue(new Promise(() => {}));
        startWithLegacyStorage();
        failExportPageLoad();

        const pull = getHandler('legacy-origin-storage/pull');
        await pull({} as never);
        await pull({} as never);

        expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
    });

    it('offers the way out after a failed import too, and quits when asked', async () => {
        jest.mocked(dialog.showMessageBox).mockResolvedValue({
            response: FAILED_MOVE_RESPONSES.quit,
            checkboxChecked: false,
        });
        const { store } = startWithLegacyStorage();
        // Settles the export, whose timeout would otherwise outlive the test.
        failExportPageLoad();

        await getHandler('legacy-origin-storage/report-import')({} as never, {
            success: false,
            error: 'QuotaExceededError',
        });
        await settleDialog();

        expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
        expect(app.quit).toHaveBeenCalledTimes(1);
        expect(restartApp).not.toHaveBeenCalled();
        expect(store.setLegacyOriginStorageSettings).not.toHaveBeenCalled();
    });
});
