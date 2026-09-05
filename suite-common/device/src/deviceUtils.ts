import type {
    DeviceCancelledErrType,
    DeviceErrorType,
    DeviceNotConnectedErrorType,
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

export const DeviceNotConnectedError = (
    message: string | null = null,
): DeviceNotConnectedErrorType => ({
    type: 'DeviceNotConnectedError' as const,
    message: message ?? 'Device is not connected',
});
type ShouldDeviceBeRememberedParams = {
    device: TrezorDevice | Device;
    isAutoEjectEnabled?: boolean;
};

export const shouldDeviceBeRemembered = ({
    device,
    isAutoEjectEnabled = false,
}: ShouldDeviceBeRememberedParams) => {
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
