import type {
    DeviceCancelledErrType,
    DeviceErrorType,
    TrezorDevice,
    TrezorDeviceWithState,
} from '@suite-common/suite-types';
import { type Device } from '@trezor/connect';

export const DeviceCancelledErr = (): DeviceCancelledErrType => ({
    type: 'DeviceCancelled' as const,
});

export const isCanceledErrorMessage = (errorMessage: string | null | undefined) =>
    Boolean(errorMessage?.toLocaleLowerCase().includes('cancelled'));

export const DeviceError = (message: string): DeviceErrorType => ({
    type: 'DeviceError' as const,
    message,
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

export const isStablecoinYieldSupported = (_device: TrezorDevice | undefined) =>
    // TODO: Replace with actual fw capability check once defined in trezor/trezor-firmware#6435.
    // device?.unavailableCapabilities?.['erc4626'] !== 'update-required';
    true;

export const isTrezorDeviceWithState = (
    device: TrezorDevice | undefined,
): device is TrezorDeviceWithState =>
    device !== undefined &&
    device.id !== null &&
    device.state !== undefined &&
    device.state !== null &&
    device.state.staticSessionId !== undefined;
