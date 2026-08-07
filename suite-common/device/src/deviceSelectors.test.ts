import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { portfolioTrackerDevice } from './deviceConstants';
import { deviceReducerInitialState } from './deviceReducer';
import {
    selectDeviceModelWithFlagshipFallback,
    selectIsDeviceAuthenticityCheckSupported,
} from './deviceSelectors';

describe(selectIsDeviceAuthenticityCheckSupported.name, () => {
    it('returns true for supported Trezor Safe devices', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: mockSuiteDevice({}, { internal_model: DeviceModelInternal.T3B1 }),
            },
        };

        expect(selectIsDeviceAuthenticityCheckSupported(state)).toBe(true);
    });

    it('returns false for devices without authenticity-check support', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: mockSuiteDevice({}, { internal_model: DeviceModelInternal.T2T1 }),
            },
        };

        expect(selectIsDeviceAuthenticityCheckSupported(state)).toBe(false);
    });

    it('returns true for portfolio tracker device', () => {
        const state = {
            device: {
                ...deviceReducerInitialState,
                selectedDevice: portfolioTrackerDevice,
            },
        };

        expect(selectIsDeviceAuthenticityCheckSupported(state)).toBe(true);
    });
});

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
