import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { asDeviceUniquePath } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { createAdditionalBackupThunk } from '../createAdditionalBackupThunk';

const devicePath = asDeviceUniquePath('1');

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

describe('createAdditionalBackupThunk', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterAll(() => {
        jest.clearAllMocks();
    });

    it('succeeds when both verification and backup succeed', async () => {
        testMocks.setTrezorConnectFixtures([{ success: true }, { success: true }]);

        const store = initStore();
        const result = await store.dispatch(createAdditionalBackupThunk({ devicePath })).unwrap();

        expect(result).toEqual({ success: true });
    });

    it('fails with verify-ownership phase when recovery fails', async () => {
        testMocks.setTrezorConnectFixtures([
            { success: false, error: { message: 'Verification failed' } },
        ]);

        const store = initStore();
        const result = await store.dispatch(createAdditionalBackupThunk({ devicePath })).unwrap();

        expect(result).toEqual({ success: false, phase: 'verify-ownership' });
    });

    it('fails with backup phase when backup fails', async () => {
        testMocks.setTrezorConnectFixtures([
            { success: true },
            { success: false, error: { message: 'Backup failed' } },
        ]);

        const store = initStore();
        const result = await store.dispatch(createAdditionalBackupThunk({ devicePath })).unwrap();

        expect(result).toEqual({ success: false, phase: 'backup' });
    });

    it('calls onVerificationComplete after successful verification', async () => {
        testMocks.setTrezorConnectFixtures([{ success: true }, { success: true }]);

        const onVerificationComplete = jest.fn();
        const store = initStore();

        await store
            .dispatch(
                createAdditionalBackupThunk({
                    devicePath,
                    onVerificationComplete,
                }),
            )
            .unwrap();

        expect(onVerificationComplete).toHaveBeenCalledTimes(1);
    });

    it('does not call onVerificationComplete when verification fails', async () => {
        testMocks.setTrezorConnectFixtures([
            { success: false, error: { message: 'Verification failed' } },
        ]);

        const onVerificationComplete = jest.fn();
        const store = initStore();

        await store
            .dispatch(
                createAdditionalBackupThunk({
                    devicePath,
                    onVerificationComplete,
                }),
            )
            .unwrap();

        expect(onVerificationComplete).not.toHaveBeenCalled();
    });
});
