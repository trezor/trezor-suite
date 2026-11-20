import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceConnected } from '@suite-common/device';
import { DeviceConnectionGuardScreen } from '@suite-native/device-authorization';

import { useCloseTradingFlow } from '../../hooks/general/useCloseTradingFlow';

export type TradingDeviceConnectionGuardProps = {
    children: ReactNode;
};

export const TradingDeviceConnectionGuard = ({ children }: TradingDeviceConnectionGuardProps) => {
    const closeTradingFlow = useCloseTradingFlow();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    if (!isDeviceConnected) {
        return <DeviceConnectionGuardScreen onCancel={closeTradingFlow} />;
    }

    return children;
};
