import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { selectIsDeviceFirmwareSupported } from './selectors';

const supportedVersion = { major_version: 2, minor_version: 8, patch_version: 0 };
const unsupportedVersion = { major_version: 2, minor_version: 5, patch_version: 3 };

const getDeviceState = (selectedDevice?: TrezorDevice): DeviceRootState => ({
    device: { ...deviceInitialState, selectedDevice },
});

describe(selectIsDeviceFirmwareSupported.name, () => {
    it('returns true for valid firmware above the minimal version', () => {
        const device = mockSuiteDevice({ connected: true, firmware: 'valid' }, supportedVersion);

        expect(selectIsDeviceFirmwareSupported(getDeviceState(device))).toBe(true);
    });

    it('returns false for required firmware above the minimal version', () => {
        const device = mockSuiteDevice({ connected: true, firmware: 'required' }, supportedVersion);

        expect(selectIsDeviceFirmwareSupported(getDeviceState(device))).toBe(false);
    });

    it('returns false for firmware below the minimal version', () => {
        const device = mockSuiteDevice(
            { connected: true, firmware: 'valid' },
            { ...unsupportedVersion, internal_model: DeviceModelInternal.T3T1 },
        );

        expect(selectIsDeviceFirmwareSupported(getDeviceState(device))).toBe(false);
    });

    it('returns true when no device is selected', () => {
        expect(selectIsDeviceFirmwareSupported(getDeviceState())).toBe(true);
    });
});
