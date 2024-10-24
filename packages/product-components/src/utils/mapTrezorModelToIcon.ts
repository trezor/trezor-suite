import { IconName } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';

export const mapTrezorModelToIcon: Record<DeviceModelInternal, IconName> = {
    [DeviceModelInternal.T1B1]: 'trezorModelOneFilled',
    [DeviceModelInternal.T2T1]: 'trezorModelTFilled',
    [DeviceModelInternal.T2B1]: 'trezorSafe3Filled',
    [DeviceModelInternal.T3B1]: 'trezorSafe3Filled',
    [DeviceModelInternal.T3T1]: 'trezorSafe5Filled',
    [DeviceModelInternal.T3W1]: 'trezorSafe7Filled',
};
