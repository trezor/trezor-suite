import { useSelector } from 'react-redux';

import { Icon, IconSize } from '@suite-common/icons';
import {
    DeviceRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDeviceModelById,
} from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';

import { DeviceModelIcon } from '../DeviceModelIcon';

type DeviceItemIconProps = {
    deviceId: TrezorDevice['id'];
    iconSize: IconSize;
};

export const DeviceItemIcon = ({ deviceId, iconSize }: DeviceItemIconProps) => {
    const deviceModel = useSelector((state: DeviceRootState) =>
        selectDeviceModelById(state, deviceId),
    );

    if (deviceId === PORTFOLIO_TRACKER_DEVICE_ID) {
        return <Icon name="database" color="iconDefault" size={iconSize} />;
    }
    if (deviceModel !== null) {
        return <DeviceModelIcon deviceModel={deviceModel} size={iconSize} />;
    }

    return <Icon name="trezor" color="iconDefault" size={iconSize} />;
};
