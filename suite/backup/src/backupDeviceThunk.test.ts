import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { DeviceModelInternal } from '@trezor/device-utils';

import {
    type BackupDeviceThunkDeps,
    type BackupDeviceThunkState,
    backupDeviceThunk,
} from './backupDeviceThunk';
import { backupActions } from './backupReducer';

const selectedDevice = mockSuiteDevice(
    {
        connected: true,
        type: 'acquired',
        path: '1',
    },
    {
        major_version: 2,
        internal_model: DeviceModelInternal.T2T1,
    },
);

const defaultState: BackupDeviceThunkState = {
    device: {
        devices: [],
        persistentDeviceData: [],
        selectedDevice,
    },
};

const createThunkDependencies = (
    state: BackupDeviceThunkState,
    analyticsReport?: DesktopAnalyticsDep['analytics']['report'],
): {
    dispatch: jest.Mock;
    getState: jest.Mock<BackupDeviceThunkState, []>;
    extra: BackupDeviceThunkDeps;
} => ({
    dispatch: jest.fn(),
    getState: jest.fn(() => state),
    extra: {
        services: {
            analytics: mockDesktopAnalytics(analyticsReport),
        },
    },
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
        const report = jest.fn();
        const { dispatch, getState, extra } = createThunkDependencies(defaultState, report);

        await backupDeviceThunk({ params: {} })(dispatch, getState, extra);

        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: backupActions.setInProgress.type,
                payload: true,
            }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({ type: 'backup-success' }),
            }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: backupActions.setInProgress.type,
                payload: false,
            }),
        );
        expect(report).toHaveBeenCalledTimes(1);
        expect(report).toHaveBeenCalledWith({
            type: events.createBackupEvent.name,
            payload: {
                status: 'finished',
                error: '',
            },
        });
    });

    it('backup success with skipSuccessToast', async () => {
        testMocks.setTrezorConnectFixtures({ success: true });
        const { dispatch, getState, extra } = createThunkDependencies(defaultState);

        await backupDeviceThunk({ params: {}, skipSuccessToast: true })(dispatch, getState, extra);

        expect(dispatch).not.toHaveBeenCalledWith(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({ type: 'backup-success' }),
            }),
        );
    });

    it('backup error', async () => {
        testMocks.setTrezorConnectFixtures({
            success: false,
            error: { message: 'avadakedavra' },
        });
        const { dispatch, getState, extra } = createThunkDependencies(defaultState);

        await backupDeviceThunk({ params: {} })(dispatch, getState, extra);

        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: backupActions.setInProgress.type,
                payload: true,
            }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({ type: 'backup-failed' }),
            }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: backupActions.setError.type,
                payload: 'avadakedavra',
            }),
        );
    });

    it('backup without device shows error toast', async () => {
        const { dispatch, getState, extra } = createThunkDependencies({
            device: {
                ...defaultState.device,
                selectedDevice: undefined,
            },
        });

        await backupDeviceThunk({ params: {} })(dispatch, getState, extra);

        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({
                    type: 'error',
                    error: 'Device not connected',
                }),
            }),
        );
    });
});
