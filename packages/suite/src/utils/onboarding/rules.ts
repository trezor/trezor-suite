import {
    DISALLOWED_IS_NOT_SAME_DEVICE,
    DISALLOWED_DEVICE_IS_NOT_CONNECTED,
    DISALLOWED_DEVICE_IS_NOT_USED_HERE,
    DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
    DISALLOWED_DEVICE_IS_REQUESTING_PIN,
    DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE,
} from '@suite/constants/onboarding/steps';
import { PrevDeviceId } from '@suite/types/onboarding/connect';

type Device = any; // todo: finish when connect types ready.

export const isNotConnected = ({ device }: { device?: Device }) =>
    device && device !== null && device.connected !== true;

export const isNotSameDevice = ({
    device,
    prevDeviceId,
}: {
    device?: Device;
    prevDeviceId: PrevDeviceId;
}) => {
    // if no device was connected before, assume it is same device
    const deviceId = device.features.device_id;
    if (!prevDeviceId || !deviceId) {
        return null;
    }
    return deviceId !== prevDeviceId;
};

export const isNotUsedHere = ({ device }: { device?: Device }) => {
    if (!device || !device.connected) {
        return null;
    }
    return device.status !== 'available' || device.type === 'unacquired';
};

export const isInBootloader = ({ device }: { device?: Device }) => {
    if (!device || !device.features) {
        return null;
    }
    return device.features.bootloader_mode === true;
};

export const isRequestingPin = ({ device }: { device?: Device }) => {
    if (!device) {
        return null;
    }
    return !!device.isRequestingPin;
};

export const isNotNewDevice = ({
    device,
    asNewDevice,
}: {
    device?: Device;
    asNewDevice: boolean | null;
}) => {
    if (!device || !asNewDevice) {
        return null;
    }
    return device.features.firmware_present !== false;
};

export const getFnForRule = (rule: string) => {
    switch (rule) {
        case DISALLOWED_IS_NOT_SAME_DEVICE:
            return isNotSameDevice;
        case DISALLOWED_DEVICE_IS_NOT_CONNECTED:
            return isNotConnected;
        case DISALLOWED_DEVICE_IS_NOT_USED_HERE:
            return isNotUsedHere;
        case DISALLOWED_DEVICE_IS_IN_BOOTLOADER:
            return isInBootloader;
        case DISALLOWED_DEVICE_IS_REQUESTING_PIN:
            return isRequestingPin;
        case DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE:
            return isNotNewDevice;
        default:
            throw new Error(`Wrong rule passed: ${rule}`);
    }
};
