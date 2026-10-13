import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DEFAULT_FLAGSHIP_MODEL } from '@trezor/device';
import { DeviceModelInternal } from '@trezor/device-utils';

import { deviceReducerInitialState } from './deviceReducer';
import { selectDeviceModelWithFlagshipFallback } from './deviceSelectors';

describe(selectDeviceModelWithFlagshipFallback.name, () => {
    it('returns the model of the selected device', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: mockSuiteDevice({}, { internal_model: DeviceModelInternal.T3T1 }),
            },
        };

        expect(selectDeviceModelWithFlagshipFallback(state)).toBe(DeviceModelInternal.T3T1);
    });

    it('returns the flagship model when the model of the selected device cannot be read', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: mockSuiteDevice(
                    {},
                    { internal_model: DeviceModelInternal.UNKNOWN },
                ),
            },
        };

        expect(selectDeviceModelWithFlagshipFallback(state)).toBe(DEFAULT_FLAGSHIP_MODEL);
    });

    it('returns the flagship model when no device is selected', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: undefined,
            },
        };

        expect(selectDeviceModelWithFlagshipFallback(state)).toBe(DEFAULT_FLAGSHIP_MODEL);
    });
});
