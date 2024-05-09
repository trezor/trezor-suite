import { Icon, IconName } from '@suite-common/icons';
import { AcquiredDevice } from '@suite-common/suite-types';
import { DeviceModelInternal } from '@trezor/connect';

const icons = {
    T1B1: 'trezorT1B1',
    T2T1: 'trezorT2T1',
    T2B1: 'trezorT2B1',
    T3T1: 'trezorT3T1',
} as const satisfies Record<DeviceModelInternal, IconName>;

type TrezorModelIconProps = { device: AcquiredDevice };

export const TrezorModelIcon = ({ device }: TrezorModelIconProps) => {
    const model = device.features?.internal_model as DeviceModelInternal;
    const iconName = icons[model];
    if (!iconName) return null;

    return <Icon name={iconName} size="extraLarge" />;
};
