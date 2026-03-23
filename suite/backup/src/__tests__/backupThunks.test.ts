import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { DeviceModelInternal } from '@trezor/device-utils';

import { backupActions } from '../backupReducer';
import { backupDeviceThunk } from '../backupThunks';

const defaultDeviceState = {
    selectedDevice: {
        connected: true,
        type: 'acquired' as const,
        path: '1',
        features: {
            major_version: 2,
            internal_model: DeviceModelInternal.T2T1,
        },
    },
    devices: [],
};

const initStore = (deviceState = defaultDeviceState) =>
    configureMockStore({
        preloadedState: { device: deviceState },
    });

describe('Backup Thunks', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterAll(() => {
        jest.clearAllMocks();
    });

    it('backup success', async () => {
        testMocks.setTrezorConnectFixtures({ success: true });

        const store = initStore();

        await store.dispatch(backupDeviceThunk({ params: {} }));

        const actions = store.getActions();
        expect(actions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: backupActions.setInProgress.type,
                    payload: true,
                }),
                expect.objectContaining({
                    type: notificationsActions.addToast.type,
                    payload: expect.objectContaining({ type: 'backup-success' }),
                }),
                expect.objectContaining({
                    type: backupActions.setInProgress.type,
                    payload: false,
                }),
            ]),
        );
    });

    it('backup success with skipSuccessToast', async () => {
        testMocks.setTrezorConnectFixtures({ success: true });

        const store = initStore();

        await store.dispatch(backupDeviceThunk({ params: {}, skipSuccessToast: true }));

        const actions = store.getActions();
        expect(actions).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: notificationsActions.addToast.type,
                    payload: expect.objectContaining({ type: 'backup-success' }),
                }),
            ]),
        );
    });

    it('backup error', async () => {
        testMocks.setTrezorConnectFixtures({
            success: false,
            error: { message: 'avadakedavra' },
        });

        const store = initStore();

        await store.dispatch(backupDeviceThunk({ params: {} }));

        const actions = store.getActions();
        expect(actions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: backupActions.setInProgress.type,
                    payload: true,
                }),
                expect.objectContaining({
                    type: notificationsActions.addToast.type,
                    payload: expect.objectContaining({ type: 'backup-failed' }),
                }),
                expect.objectContaining({
                    type: backupActions.setError.type,
                    payload: 'avadakedavra',
                }),
            ]),
        );
    });

    it('backup without device shows error toast', async () => {
        const store = initStore({
            selectedDevice: undefined as any,
            devices: [],
        });

        await store.dispatch(backupDeviceThunk({ params: {} }));

        const actions = store.getActions();
        expect(actions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: notificationsActions.addToast.type,
                    payload: expect.objectContaining({
                        type: 'error',
                        error: 'Device not connected',
                    }),
                }),
            ]),
        );
    });
});
