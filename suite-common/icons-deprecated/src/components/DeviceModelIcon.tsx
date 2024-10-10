import { DeviceModelInternal } from '@trezor/connect';

import { IconSize } from '../config';
import { IconName } from '../icons';
import { Icon } from './Icon';

type DeviceModelIconProps = {
    deviceModel: DeviceModelInternal;
    size?: IconSize | number;
};

const icons = {
    T1B1: 'trezorT1B1',
    T2T1: 'trezorT2T1',
    T2B1: 'trezorT3B1',
    T3B1: 'trezorT3B1',
    T3T1: 'trezorT3T1',
} as const satisfies Record<DeviceModelInternal, IconName>;

export const deviceModelToIconName = (deviceModel: DeviceModelInternal) => icons[deviceModel];

export const DeviceModelIcon = ({ deviceModel, size }: DeviceModelIconProps) => (
    <Icon name={deviceModelToIconName(deviceModel)} size={size} />
);
