import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { portfolioTrackerDevice } from '../src/deviceConstants';
import { deviceReducerInitialState } from '../src/deviceReducer';
import { selectIsDeviceAuthenticityCheckSupported } from '../src/deviceSelectors';

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
