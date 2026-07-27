import { type IconComponent } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import {
    TrezorDevicesFilledIcon,
    TrezorDevicesIcon,
    TrezorModelOneFilledIcon,
    TrezorModelOneIcon,
    TrezorModelTFilledIcon,
    TrezorModelTIcon,
    TrezorSafe3FilledIcon,
    TrezorSafe3Icon,
    TrezorSafe5FilledIcon,
    TrezorSafe5Icon,
    TrezorSafe7FilledIcon,
    TrezorSafe7Icon,
} from '@trezor/icons';

export const mapTrezorModelToIcon: Record<DeviceModelInternal, IconComponent> = {
    [DeviceModelInternal.UNKNOWN]: TrezorDevicesIcon,
    [DeviceModelInternal.T1B1]: TrezorModelOneIcon,
    [DeviceModelInternal.T2T1]: TrezorModelTIcon,
    [DeviceModelInternal.T2B1]: TrezorSafe3Icon,
    [DeviceModelInternal.T3B1]: TrezorSafe3Icon,
    [DeviceModelInternal.T3T1]: TrezorSafe5Icon,
    [DeviceModelInternal.T3W1]: TrezorSafe7Icon,
};

export const mapTrezorModelToFilledIcon: Record<DeviceModelInternal, IconComponent> = {
    [DeviceModelInternal.UNKNOWN]: TrezorDevicesFilledIcon,
    [DeviceModelInternal.T1B1]: TrezorModelOneFilledIcon,
    [DeviceModelInternal.T2T1]: TrezorModelTFilledIcon,
    [DeviceModelInternal.T2B1]: TrezorSafe3FilledIcon,
    [DeviceModelInternal.T3B1]: TrezorSafe3FilledIcon,
    [DeviceModelInternal.T3T1]: TrezorSafe5FilledIcon,
    [DeviceModelInternal.T3W1]: TrezorSafe7FilledIcon,
};
