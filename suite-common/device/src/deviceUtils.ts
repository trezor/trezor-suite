import type {
    DeviceCancelledErrType,
    DeviceErrorType,
    TrezorDevice,
    TrezorDeviceWithState,
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

export const isStablecoinYieldSupported = (device: TrezorDevice | undefined) => {
    if (device?.features?.internal_model === DeviceModelInternal.T1B1) {
        return true;
    }

    const firmware = getFirmwareVersionArray(device);

    return firmware !== null && versionUtils.isNewerOrEqual(firmware, [2, 11, 2]);
};

export const isTrezorDeviceWithState = (
    device: TrezorDevice | undefined,
): device is TrezorDeviceWithState =>
    device !== undefined &&
    device.id !== null &&
    device.state !== undefined &&
    device.state !== null &&
    device.state.staticSessionId !== undefined;
