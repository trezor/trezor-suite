import { createSuiteSyncDeleteLocalDataError } from '@suite-common/suite-sync-storage';
import { notificationsActions } from '@suite-common/toast-notifications';
import { desktopApi } from '@trezor/suite-desktop-api';
import { err, ok } from '@trezor/type-utils';

import { resetSuiteAppThunk } from '../suiteThunks';

const mockReloadApp = jest.fn();

jest.mock('src/utils/suite/reload', () => ({
    reloadApp: () => mockReloadApp(),
}));

jest.mock('@suite/router', () => ({
    goto: () => ({ type: 'suite/goto' }),
}));

jest.mock('../storageActions', () => ({
    removeDatabase: () => ({ type: 'suite/removeDatabase' }),
}));

jest.mock('@trezor/suite-desktop-api', () => ({
    desktopApi: {
        available: true,
        appAutoStart: jest.fn(),
        clearStore: jest.fn(),
    },
}));

describe(resetSuiteAppThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deletes Suite Sync local data when resetting the app', async () => {
        const dispatch = jest.fn();
        const deleteSuiteSyncLocalData = jest.fn(() => Promise.resolve(ok()));
        const clearLocalStorage = jest.spyOn(Storage.prototype, 'clear');

        await resetSuiteAppThunk()(dispatch, jest.fn(), {
            services: {
                suiteSync: {
                    deleteSuiteSyncLocalData,
                },
            },
        } as any);

        expect(deleteSuiteSyncLocalData).toHaveBeenCalledTimes(1);
        expect(clearLocalStorage).toHaveBeenCalledTimes(1);
        expect(desktopApi.clearStore).toHaveBeenCalledTimes(1);
        expect(desktopApi.appAutoStart).toHaveBeenCalledWith(false);
        expect(mockReloadApp).toHaveBeenCalledTimes(1);

        const deleteSuiteSyncLocalDataCallOrder =
            deleteSuiteSyncLocalData.mock.invocationCallOrder[0];
        const clearLocalStorageCallOrder = clearLocalStorage.mock.invocationCallOrder[0];

        expect(deleteSuiteSyncLocalDataCallOrder).toBeDefined();
        expect(clearLocalStorageCallOrder).toBeDefined();

        if (
            deleteSuiteSyncLocalDataCallOrder === undefined ||
            clearLocalStorageCallOrder === undefined
        ) {
            throw new Error('Expected reset cleanup calls to be tracked.');
        }

        expect(deleteSuiteSyncLocalDataCallOrder).toBeLessThan(clearLocalStorageCallOrder);
    });

    it('shows error notification and rejects when Suite Sync local data deletion fails', async () => {
        const dispatch = jest.fn();
        const deleteLocalDataError = createSuiteSyncDeleteLocalDataError(
            'Delete failed',
            new Error('Delete failed'),
        );
        const deleteSuiteSyncLocalData = jest.fn(() => Promise.resolve(err(deleteLocalDataError)));
        const clearLocalStorage = jest.spyOn(Storage.prototype, 'clear');

        const result = await resetSuiteAppThunk()(dispatch, jest.fn(), {
            services: {
                suiteSync: {
                    deleteSuiteSyncLocalData,
                },
            },
        } as any);

        expect(deleteSuiteSyncLocalData).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    type: 'error',
                    error: deleteLocalDataError.message,
                }),
                type: notificationsActions.addToast.type,
            }),
        );
        expect(result.type).toBe(resetSuiteAppThunk.rejected.type);
        expect(result.payload).toBe(deleteLocalDataError.message);
        expect(clearLocalStorage).not.toHaveBeenCalled();
        expect(desktopApi.clearStore).not.toHaveBeenCalled();
        expect(desktopApi.appAutoStart).not.toHaveBeenCalled();
        expect(mockReloadApp).not.toHaveBeenCalled();
    });
});
