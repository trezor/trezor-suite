import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceConnected } from '@suite-common/device';
import { DeviceConnectionGuardScreen } from '@suite-native/device-authorization';

type EarnDeviceConnectionGuardProps = {
    children: ReactNode;
};

export const EarnDeviceConnectionGuard = ({ children }: EarnDeviceConnectionGuardProps) => {
    const navigation = useNavigation();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    if (!isDeviceConnected) {
        return <DeviceConnectionGuardScreen onCancel={navigation.goBack} />;
    }

    return children;
};
