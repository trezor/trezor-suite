import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { selectIsDeviceFirmwareSupported, selectShouldForceFirmwareUpdate } from './selectors';

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

describe(selectShouldForceFirmwareUpdate.name, () => {
    it('returns true for connected device with required firmware', () => {
        const device = mockSuiteDevice({ connected: true, firmware: 'required' }, supportedVersion);

        expect(selectShouldForceFirmwareUpdate(getDeviceState(device))).toBe(true);
    });

    it('returns true for connected device with firmware below the minimal version', () => {
        const device = mockSuiteDevice({ connected: true, firmware: 'valid' }, unsupportedVersion);

        expect(selectShouldForceFirmwareUpdate(getDeviceState(device))).toBe(true);
    });

    it('returns false for connected device with supported firmware', () => {
        const device = mockSuiteDevice({ connected: true, firmware: 'outdated' }, supportedVersion);

        expect(selectShouldForceFirmwareUpdate(getDeviceState(device))).toBe(false);
    });

    it('returns false for disconnected device', () => {
        const device = mockSuiteDevice(
            { connected: false, firmware: 'required' },
            supportedVersion,
        );

        expect(selectShouldForceFirmwareUpdate(getDeviceState(device))).toBe(false);
    });

    it('returns false for device without setup support', () => {
        const device = mockSuiteDevice(
            { connected: true, firmware: 'required' },
            {
                major_version: 1,
                minor_version: 11,
                patch_version: 0,
                internal_model: DeviceModelInternal.T1B1,
            },
        );

        expect(selectShouldForceFirmwareUpdate(getDeviceState(device))).toBe(false);
    });

    it('returns false for device in bootloader mode', () => {
        const device = mockSuiteDevice({
            connected: true,
            mode: 'bootloader',
            firmware: 'required',
        });

        expect(selectShouldForceFirmwareUpdate(getDeviceState(device))).toBe(false);
    });

    it('returns false for uninitialized device', () => {
        const device = mockSuiteDevice(
            { connected: true, mode: 'initialize', firmware: 'required' },
            { ...supportedVersion, initialized: false },
        );

        expect(selectShouldForceFirmwareUpdate(getDeviceState(device))).toBe(false);
    });
});
