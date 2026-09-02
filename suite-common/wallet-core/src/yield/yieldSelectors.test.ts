import {
    type DeviceRootState,
    deviceInitialState,
    portfolioTrackerDevice,
} from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { selectIsWrappedNativeFlowSupported } from './yieldSelectors';

const createState = (selectedDevice?: TrezorDevice): DeviceRootState => ({
    device: { ...deviceInitialState, selectedDevice },
});

const createStateWithFirmware = ([major, minor, patch]: [number, number, number]) =>
    createState(
        mockSuiteDevice({}, { major_version: major, minor_version: minor, patch_version: patch }),
    );

describe('selectIsWrappedNativeFlowSupported', () => {
    it('returns false when no device is selected', () => {
        expect(selectIsWrappedNativeFlowSupported(createState())).toBe(false);
    });

    it('requires firmware 2.12.4', () => {
        expect(selectIsWrappedNativeFlowSupported(createStateWithFirmware([2, 12, 3]))).toBe(false);
        expect(selectIsWrappedNativeFlowSupported(createStateWithFirmware([2, 12, 4]))).toBe(true);
    });

    it('returns true for T1B1 regardless of firmware version', () => {
        const device = mockSuiteDevice(
            {},
            {
                internal_model: DeviceModelInternal.T1B1,
                major_version: 1,
                minor_version: 10,
                patch_version: 0,
            },
        );

        expect(selectIsWrappedNativeFlowSupported(createState(device))).toBe(true);
    });

    it('returns false for the portfolio-tracker device', () => {
        expect(selectIsWrappedNativeFlowSupported(createState(portfolioTrackerDevice))).toBe(false);
    });
});
