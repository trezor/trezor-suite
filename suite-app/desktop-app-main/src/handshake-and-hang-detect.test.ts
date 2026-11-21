import { type BrowserWindow, type IpcMainInvokeEvent, dialog } from 'electron';

import { handshakeAndHangDetect } from './handshake-and-hang-detect';
import { ipcMain } from './ipcMain';
import type { ILogger } from './libs/logger';

jest.mock('electron', () => ({
    dialog: { showMessageBox: jest.fn() },
}));

jest.mock('./ipcMain', () => ({
    ipcMain: { handle: jest.fn(), handleOnce: jest.fn(), removeHandler: jest.fn() },
}));

jest.mock('./libs/loadIndex', () => ({ loadIndex: jest.fn() }));

jest.mock('./libs/isMainWindowUsable', () => ({ isMainWindowUsable: () => true }));

const HANG_WAIT_MS = 30_000;
const WAIT_BUTTON_INDEX = 0;

const mainWindow = {} as unknown as BrowserWindow;
const logger = { info: jest.fn() } as unknown as ILogger;

describe(handshakeAndHangDetect.name, () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        jest.mocked(dialog.showMessageBox).mockResolvedValue({
            response: WAIT_BUTTON_INDEX,
            checkboxChecked: false,
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('asks the user what to do once the renderer has not shaken hands in time', async () => {
        handshakeAndHangDetect({ mainWindow, logger, isHandshakeDelayed: () => false });

        await jest.advanceTimersByTimeAsync(HANG_WAIT_MS);

        expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
    });

    it('keeps waiting while the handshake is delayed and asks once it no longer is', async () => {
        const isHandshakeDelayed = jest.fn().mockReturnValue(true);
        handshakeAndHangDetect({ mainWindow, logger, isHandshakeDelayed });

        await jest.advanceTimersByTimeAsync(3 * HANG_WAIT_MS);

        expect(dialog.showMessageBox).not.toHaveBeenCalled();

        isHandshakeDelayed.mockReturnValue(false);
        await jest.advanceTimersByTimeAsync(HANG_WAIT_MS);

        expect(dialog.showMessageBox).toHaveBeenCalledTimes(1);
    });

    it('stops waiting once a delayed handshake arrives', async () => {
        const isHandshakeDelayed = jest.fn().mockReturnValue(true);
        const { handshake } = handshakeAndHangDetect({ mainWindow, logger, isHandshakeDelayed });
        await jest.advanceTimersByTimeAsync(HANG_WAIT_MS);

        const handleHandshake = jest.mocked(ipcMain.handleOnce).mock.calls[0]?.[1];
        handleHandshake?.({} as unknown as IpcMainInvokeEvent);
        isHandshakeDelayed.mockReturnValue(false);
        await jest.advanceTimersByTimeAsync(2 * HANG_WAIT_MS);

        await expect(handshake).resolves.toBe('success');
        expect(dialog.showMessageBox).not.toHaveBeenCalled();
    });
});
