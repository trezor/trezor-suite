import { IconName } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';

export const mapTrezorModelToIcon: Record<DeviceModelInternal, IconName> = {
    [DeviceModelInternal.UNKNOWN]: 'trezorDevices',
    [DeviceModelInternal.T1B1]: 'trezorModelOne',
    [DeviceModelInternal.T2T1]: 'trezorModelT',
    [DeviceModelInternal.T2B1]: 'trezorSafe3',
    [DeviceModelInternal.T3B1]: 'trezorSafe3',
    [DeviceModelInternal.T3T1]: 'trezorSafe5',
    [DeviceModelInternal.T3W1]: 'trezorSafe7',
};
