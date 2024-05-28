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
    T2B1: 'trezorT2B1',
    T3T1: 'trezorT3T1',
} as const satisfies Record<DeviceModelInternal, IconName>;

export const DeviceModelIcon = ({ deviceModel, size }: DeviceModelIconProps) => (
    <Icon name={icons[deviceModel]} size={size} />
);
