import type {
    DeviceCancelledErrType,
    DeviceErrorType,
    DeviceNotConnectedErrorType,
    TrezorDevice,
    TrezorDeviceWithState,
    YieldFlowType,
} from '@suite-common/suite-types';
import { type Device } from '@trezor/connect';
import { DeviceModelInternal, getFirmwareVersionArray } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

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

export const isStablecoinYieldSupported = (
    device: TrezorDevice | undefined,
    flowType?: YieldFlowType,
): boolean => {
    if (device?.features?.internal_model === DeviceModelInternal.T1B1) {
        return true;
    }

    const firmware = getFirmwareVersionArray(device);

    if (firmware === null) {
        return false;
    }

    if (flowType === 'claim') {
        return versionUtils.isNewerOrEqual(firmware, [2, 12, 1]);
    }

    return versionUtils.isNewerOrEqual(firmware, [2, 12, 0]);
};

export const isTrezorDeviceWithState = (
    device: TrezorDevice | undefined,
): device is TrezorDeviceWithState =>
    device !== undefined && device.id !== null && device.state?.staticSessionId !== undefined;
