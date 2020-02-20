import {
    DISALLOWED_IS_NOT_SAME_DEVICE,
    DISALLOWED_DEVICE_IS_NOT_CONNECTED,
    DISALLOWED_DEVICE_IS_NOT_USED_HERE,
    DISALLOWED_DEVICE_IS_IN_BOOTLOADER,
    DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE,
} from '@onboarding-constants/steps';
import { AnyPath } from '@onboarding-types/steps';
import { TrezorDevice } from '@suite-types';

export const isNotConnected = ({ device }: { device?: TrezorDevice }) => !device;

export const isNotSameDevice = ({
    device,
    prevDevice,
}: {
    device?: TrezorDevice;
    // todo: typescript
    prevDevice: any;
}) => {
    const prevDeviceId = prevDevice && prevDevice.features && prevDevice.features.device_id;
    // if no device was connected before, assume it is same device
    if (!prevDeviceId) {
        return false;
    }
    const deviceId = device && device.features && device.features.device_id;
    if (!deviceId) {
        return null;
    }
    return deviceId !== prevDeviceId;
};

export const isNotUsedHere = ({ device }: { device?: TrezorDevice }) => {
    if (!device) {
        return null;
    }
    return device.type === 'unacquired';
};

export const isInBootloader = ({ device }: { device?: TrezorDevice }) => {
    if (!device || !device.features) {
        return null;
    }
    return device.features.bootloader_mode === true;
};

export const isNotNewDevice = ({ device, path }: { device?: TrezorDevice; path?: AnyPath[] }) => {
    if (!device || !path || !path.includes('new')) {
        return null;
    }
    return device && device.features && device.features.firmware_present !== false;
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
        case DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE:
            return isNotNewDevice;
        default:
            throw new Error(`Wrong rule passed: ${rule}`);
    }
};
