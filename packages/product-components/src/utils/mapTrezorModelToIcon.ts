import { IconName } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';

export const mapTrezorModelToIcon: Record<DeviceModelInternal, IconName> = {
    [DeviceModelInternal.UNKNOWN]: 'trezorModelOneFilled', // Just to provide something that wont break UI
    [DeviceModelInternal.T1B1]: 'trezorModelOneFilled',
    [DeviceModelInternal.T2T1]: 'trezorModelTFilled',
    [DeviceModelInternal.T2B1]: 'trezorSafe3Filled',
    [DeviceModelInternal.T3B1]: 'trezorSafe3Filled',
    [DeviceModelInternal.T3T1]: 'trezorSafe5Filled',
    [DeviceModelInternal.T3W1]: 'trezorSafe7Filled',
};

export const mapTrezorModelToIconDeprecated: Record<DeviceModelInternal, IconName> = {
    [DeviceModelInternal.UNKNOWN]: 'trezorT1B1', // Just to provide something that won't break UI
    [DeviceModelInternal.T1B1]: 'trezorT1B1',
    [DeviceModelInternal.T2T1]: 'trezorT2T1',
    [DeviceModelInternal.T2B1]: 'trezorT2B1',
    [DeviceModelInternal.T3B1]: 'trezorT3B1',
    [DeviceModelInternal.T3T1]: 'trezorT3T1',
    [DeviceModelInternal.T3W1]: 'trezorT3W1',
};
