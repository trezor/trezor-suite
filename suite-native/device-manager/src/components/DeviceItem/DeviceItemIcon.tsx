import { useSelector } from 'react-redux';

import { PORTFOLIO_TRACKER_DEVICE_ID } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectHasOnlyEmptyPortfolioTracker } from '@suite-common/wallet-core';
import { DeviceModelIcon, Icon, type IconSize } from '@suite-native/icons';
import { type DeviceModelInternal } from '@trezor/device-utils';

type DeviceItemIconProps = {
    deviceId?: TrezorDevice['id'];
    deviceModel?: DeviceModelInternal;
    iconSize?: IconSize | number;
};

const ICON_SIZE = 28;

export const DeviceItemIcon = ({
    deviceId,
    deviceModel,
    iconSize = ICON_SIZE,
}: DeviceItemIconProps) => {
    const hasOnlyEmptyPortfolioTracker = useSelector(selectHasOnlyEmptyPortfolioTracker);

    if (!hasOnlyEmptyPortfolioTracker) {
        if (deviceId === PORTFOLIO_TRACKER_DEVICE_ID) {
            return <Icon name="database" color="contentPrimary" size={iconSize} />;
        }
        if (deviceModel) {
            return <DeviceModelIcon deviceModel={deviceModel} size={iconSize} />;
        }
    }

    return <Icon name="trezorLogo" color="contentPrimary" size={iconSize} />;
};
