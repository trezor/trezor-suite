import { DeviceModelInternal } from '@trezor/connect';

import { IconName, IconSize } from './Icon';
import { Icon } from './Icon';

type DeviceModelIconProps = {
    deviceModel: DeviceModelInternal;
    size?: IconSize | number;
};

const icons = {
    T1B1: 'trezorModelOne',
    T2T1: 'trezorModelT',
    T2B1: 'trezorSafe3',
    T3B1: 'trezorSafe3',
    T3T1: 'trezorSafe5',
    T3W1: 'trezorSafe5', // TODO T3W1
} as const satisfies Record<DeviceModelInternal, IconName>;

export const deviceModelToIconName = (deviceModel: DeviceModelInternal) => icons[deviceModel];

export const DeviceModelIcon = ({ deviceModel, size }: DeviceModelIconProps) => (
    <Icon name={deviceModelToIconName(deviceModel)} size={size} />
);
