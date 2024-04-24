import { Icon, IconName } from '@suite-common/icons';
import { AcquiredDevice } from '@suite-common/suite-types';
import { DeviceModelInternal } from '@trezor/connect';

const icons = {
    T1B1: 'trezorOne',
    T2T1: 'trezorT',
    T2B1: 'trezorTS3',
    T3T1: 'trezorTS5',
} as const satisfies Record<DeviceModelInternal, IconName>;

type TrezorModelIconProps = { device: AcquiredDevice };

export const TrezorModelIcon = ({ device }: TrezorModelIconProps) => {
    const model = device.features?.internal_model as DeviceModelInternal;
    const iconName = icons[model];
    if (!iconName) return null;

    return <Icon name={iconName} size="extraLarge" />;
};
