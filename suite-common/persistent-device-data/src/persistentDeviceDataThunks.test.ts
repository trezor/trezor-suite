import type { PersistentDeviceData } from '@suite-common/suite-types';
import { defaultDevicePersistentData, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { persistentDeviceDataActions } from './persistentDeviceDataActions';
import {
    type ProcessDiscoveryEntropyCheckThunkDeps,
    type ProcessDiscoveryEntropyCheckThunkState,
    processDiscoveryEntropyCheckThunk,
} from './persistentDeviceDataThunks';

const path = "m/84'/0'/0'";

const device = mockSuiteDevice({ id: 'device-id' });
if (device.type !== 'acquired') throw new Error('Device must be acquired');

const validAuthenticityResult: PersistentDeviceData['authenticityResult'] = {
    valid: true,
    optigaResult: { valid: true, rootPubKey: 'root-pub-key' },
    tropicResult: null,
    mcuResult: null,
};

type RunThunkParams = {
    success: boolean;
    persistentDeviceData?: Partial<PersistentDeviceData>;
};

const runThunk = ({ success, persistentDeviceData }: RunThunkParams) => {
    const extra: ProcessDiscoveryEntropyCheckThunkDeps = {
        services: { reportSecurityCheck: jest.fn() },
    };
    const state: ProcessDiscoveryEntropyCheckThunkState = {
        persistentDeviceData: {
            devices: [{ ...defaultDevicePersistentData, ...persistentDeviceData }],
        },
    };
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState, extra });

    processDiscoveryEntropyCheckThunk({ device, success, path })(dispatch, getState, extra);

    return { actions, reportSecurityCheck: extra.services.reportSecurityCheck };
};

const failedResultAction = persistentDeviceDataActions.setDiscoveryEntropyCheckResult({
    deviceId: 'device-id',
    success: false,
    path,
});

describe(processDiscoveryEntropyCheckThunk.name, () => {
    it('records and reports a failed path', () => {
        const { actions, reportSecurityCheck } = runThunk({ success: false });

        expect(reportSecurityCheck).toHaveBeenCalledWith(
            expect.objectContaining({
                level: 'error',
                checkType: 'Entropy discovery',
                payload: { path },
            }),
        );
        expect(actions).toContainEqual(failedResultAction);
    });

    it('records a successful check without reporting', () => {
        const { actions, reportSecurityCheck } = runThunk({ success: true });

        expect(reportSecurityCheck).not.toHaveBeenCalled();
        expect(actions).toContainEqual(
            persistentDeviceDataActions.setDiscoveryEntropyCheckResult({
                deviceId: 'device-id',
                success: true,
                path,
            }),
        );
    });

    it('reports but does not record a failed path for a verified model with the check disabled', () => {
        const { actions, reportSecurityCheck } = runThunk({
            success: false,
            persistentDeviceData: {
                internal_model: DeviceModelInternal.T3T1,
                authenticityResult: validAuthenticityResult,
            },
        });

        expect(reportSecurityCheck).toHaveBeenCalled();
        expect(actions).not.toContainEqual(failedResultAction);
    });

    it('records a failed path for a verified model with the check enabled', () => {
        const { actions } = runThunk({
            success: false,
            persistentDeviceData: {
                internal_model: DeviceModelInternal.T2B1,
                authenticityResult: validAuthenticityResult,
            },
        });

        expect(actions).toContainEqual(failedResultAction);
    });

    it('records a failed path for a model with the check disabled, but without a device authenticity result', () => {
        const { actions } = runThunk({
            success: false,
            persistentDeviceData: {
                internal_model: DeviceModelInternal.T3T1,
                authenticityResult: undefined,
            },
        });

        expect(actions).toContainEqual(failedResultAction);
    });

    it('records a failed path for a model with the check disabled, but with a failed device authenticity check', () => {
        const { actions } = runThunk({
            success: false,
            persistentDeviceData: {
                internal_model: DeviceModelInternal.T3T1,
                authenticityResult: { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND' },
            },
        });

        expect(actions).toContainEqual(failedResultAction);
    });
});
