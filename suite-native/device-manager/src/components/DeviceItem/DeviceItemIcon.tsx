import { useSelector } from 'react-redux';

import { TrezorDevice } from '@suite-common/suite-types';
import {
    DeviceRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDeviceModelById,
} from '@suite-common/wallet-core';
import { DeviceModelIcon, Icon } from '@suite-native/icons';

type DeviceItemIconProps = {
    deviceId: TrezorDevice['id'];
};

const ICON_SIZE = 28;

export const DeviceItemIcon = ({ deviceId }: DeviceItemIconProps) => {
    const deviceModel = useSelector((state: DeviceRootState) =>
        selectDeviceModelById(state, deviceId),
    );

    if (deviceId === PORTFOLIO_TRACKER_DEVICE_ID) {
        return <Icon name="database" color="iconDefault" size={ICON_SIZE} />;
    }
    if (deviceModel !== null) {
        return <DeviceModelIcon deviceModel={deviceModel} size={ICON_SIZE} />;
    }

    return <Icon name="trezorLogo" color="iconDefault" size={ICON_SIZE} />;
};
