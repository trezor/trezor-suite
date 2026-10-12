import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import { persistentDeviceDataActions } from './persistentDeviceDataActions';
import {
    type ProcessDiscoveryEntropyCheckThunkDeps,
    processDiscoveryEntropyCheckThunk,
} from './persistentDeviceDataThunks';

const path = "m/84'/0'/0'";

const device = mockSuiteDevice({ id: 'device-id' });
if (device.type !== 'acquired') throw new Error('Device must be acquired');

const runThunk = (success: boolean) => {
    const extra: ProcessDiscoveryEntropyCheckThunkDeps = {
        services: { reportSecurityCheck: jest.fn() },
    };
    const getState = () => ({});
    const { actions, dispatch } = createMockDispatch({ getState, extra });

    processDiscoveryEntropyCheckThunk({ device, success, path })(dispatch, getState, extra);

    return { actions, reportSecurityCheck: extra.services.reportSecurityCheck };
};

describe(processDiscoveryEntropyCheckThunk.name, () => {
    it('records and reports a failed path', () => {
        const { actions, reportSecurityCheck } = runThunk(false);

        expect(reportSecurityCheck).toHaveBeenCalledWith(
            expect.objectContaining({
                level: 'error',
                checkType: 'Entropy discovery',
                payload: { path },
            }),
        );
        expect(actions).toContainEqual(
            persistentDeviceDataActions.setDiscoveryEntropyCheckResult({
                deviceId: 'device-id',
                success: false,
                path,
            }),
        );
    });

    it('records a successful check without reporting', () => {
        const { actions, reportSecurityCheck } = runThunk(true);

        expect(reportSecurityCheck).not.toHaveBeenCalled();
        expect(actions).toContainEqual(
            persistentDeviceDataActions.setDiscoveryEntropyCheckResult({
                deviceId: 'device-id',
                success: true,
                path,
            }),
        );
    });
});
