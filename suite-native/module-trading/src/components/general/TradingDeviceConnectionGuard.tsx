import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceConnected } from '@suite-common/device';
import { DeviceConnectionGuardScreen } from '@suite-native/device-authorization';
import { type TradingStackNavigationProp } from '@suite-native/trading-types';

export type TradingDeviceConnectionGuardProps = {
    children: ReactNode;
};

export const TradingDeviceConnectionGuard = ({ children }: TradingDeviceConnectionGuardProps) => {
    const { popToTop } = useNavigation<TradingStackNavigationProp>();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    if (!isDeviceConnected) {
        return <DeviceConnectionGuardScreen onCancel={popToTop} />;
    }

    return children;
};
