import type {
    AcquiredDevice,
    DeviceCancelledErrType,
    DeviceErrorType,
    DeviceNotConnectedErrorType,
    TrezorDevice,
    TrezorDeviceWithState,
} from '@suite-common/suite-types';
import { getIsDeviceConnectedViaBluetooth, isDeviceAcquired } from '@suite-common/suite-utils';
import { type Device } from '@trezor/connect';

import { DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD } from './deviceConstants';

export const DeviceCancelledErr = (): DeviceCancelledErrType => ({
    type: 'DeviceCancelled' as const,
});

export const isCanceledErrorMessage = (errorMessage: string | null | undefined) =>
    Boolean(errorMessage?.toLocaleLowerCase().includes('cancelled'));

export const DeviceError = (message: string): DeviceErrorType => ({
    type: 'DeviceError' as const,
    message,
});

export const DeviceNotConnectedError = (
    message: string | null = null,
): DeviceNotConnectedErrorType => ({
    type: 'DeviceNotConnectedError' as const,
    message: message ?? 'Device is not connected',
});

export const shouldDeviceBeRemembered = ({
    device,
    isAutoEjectEnabled = false,
}: {
    device: TrezorDevice | Device;
    isAutoEjectEnabled?: boolean;
}) => {
    if (device.mode !== 'normal') return false;

    if (device.type !== 'acquired') return false;

    return !isAutoEjectEnabled;
};

export const isApprovalFlowSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmApproval'];

export const isEvmClearSigningSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmClearSigning'];

export const isTrezorDeviceWithState = (
    device: TrezorDevice | undefined,
): device is TrezorDeviceWithState =>
    device !== undefined && device.id !== null && device.state?.staticSessionId !== undefined;

/**
 * Whether the device is physically present AND its features have been read. A remembered wallet is
 * acquired but not connected, and a device mid-acquire is connected but not yet acquired, so both
 * halves are needed before a caller can actually talk to it.
 */
export const getIsDeviceConnectedAndAcquired = (
    device: TrezorDevice | undefined,
): device is AcquiredDevice => isDeviceAcquired(device) && device.connected;

export const getDeviceLabelOrName = (device: TrezorDevice | undefined) =>
    device?.features?.label || device?.name || '';

/**
 * Whether a firmware update would be risky to start because the device runs on battery alone and
 * that battery is low or unreadable.
 */
export const getIsDeviceConnectedViaBluetoothLowOnBattery = (device: TrezorDevice | undefined) => {
    // If not connected via Bluetooth, then there is no low battery.
    if (!getIsDeviceConnectedViaBluetooth(device)) {
        return false;
    }

    const { usb_connected, wireless_connected, soc } = device?.features || {};

    // If it is connected via USB or wireless charger, we assume it's charging/fine,
    if (usb_connected || wireless_connected) {
        return false;
    }

    const isBatteryDataValid = typeof soc === 'number';

    if (!isBatteryDataValid) {
        // If we cannot read battery status, we assume the worst.
        return true;
    }

    return soc < DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD;
};

type ConnectedDeviceQuery = {
    /** Which transport the device is expected on. Another transport is not a candidate at all. */
    apiType: TrezorDevice['descriptor']['apiType'];
    /** Where it was last seen, when that is known. Taken as the answer when a device is there. */
    path?: string;
};

/**
 * The device a flow means, resolved from the device list as it is right now.
 *
 * Addressing a device across a firmware update cannot rely on an identifier: the reboots
 * re-enumerate it under new paths and a wipe gives it a new id. What holds instead is that such a
 * flow cannot run with a second device of the same transport attached — `@trezor/connect` waits
 * for exactly one before it adopts a reconnected device — so the only usable device on that
 * transport is the one we mean. The path is preferred where it did survive, which keeps the answer
 * exact in the ordinary case, and ambiguity resolves to nothing rather than to a guess.
 */
export const resolveConnectedDevice = (
    devices: readonly TrezorDevice[],
    { apiType, path }: ConnectedDeviceQuery,
): AcquiredDevice | undefined => {
    const candidates = devices.filter(
        (device): device is AcquiredDevice =>
            getIsDeviceConnectedAndAcquired(device) && device.descriptor.apiType === apiType,
    );

    return (
        candidates.find(device => device.path === path) ??
        (candidates.length === 1 ? candidates[0] : undefined)
    );
};
