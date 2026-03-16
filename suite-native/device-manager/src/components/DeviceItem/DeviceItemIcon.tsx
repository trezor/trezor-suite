import { useSelector } from 'react-redux';

import {
    type DeviceRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDeviceModelById,
} from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { DeviceModelIcon, Icon, type IconSize } from '@suite-native/icons';

type DeviceItemIconProps = {
    deviceId: TrezorDevice['id'];
    iconSize?: IconSize | number;
};

const ICON_SIZE = 28;

export const DeviceItemIcon = ({ deviceId, iconSize = ICON_SIZE }: DeviceItemIconProps) => {
    const deviceModel = useSelector((state: DeviceRootState) =>
        selectDeviceModelById(state, deviceId),
    );

    if (deviceId === PORTFOLIO_TRACKER_DEVICE_ID) {
        return <Icon name="database" color="iconDefault" size={iconSize} />;
    }
    if (deviceModel !== null) {
        return <DeviceModelIcon deviceModel={deviceModel} size={iconSize} />;
    }

    return <Icon name="trezorLogo" color="iconDefault" size={iconSize} />;
};
