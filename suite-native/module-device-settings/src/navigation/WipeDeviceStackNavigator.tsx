import { useCallback, useState } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useWipeDevice } from '@suite-native/device';
import {
    DeviceConnectionGuardScreenWithCancel,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    WipeDeviceStackParamList,
    WipeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { FactoryResetScreen } from '../screens/FactoryResetScreen';
import { WipeDeviceContinueOnTrezorScreen } from '../screens/WipeDeviceContinueOnTrezorScreen';
import { WipeDeviceLoadingScreen } from '../screens/WipeDeviceLoadingScreen';

const WipeDeviceStack = createNativeStackNavigator<WipeDeviceStackParamList>();

export const WipeDeviceStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();
    const [isWipeDeviceStarted, setIsWipeDeviceStarted] = useState(false);

    const { wipeDevice } = useWipeDevice();

    useFocusEffect(
        useCallback(() => {
            if (!isDeviceConnectionGuardVisible && !isWipeDeviceStarted) {
                setIsWipeDeviceStarted(true);
                wipeDevice();
            }
        }, [isDeviceConnectionGuardVisible, isWipeDeviceStarted, wipeDevice]),
    );

    return (
        <WipeDeviceStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <WipeDeviceStack.Screen
                    name={WipeDeviceStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreenWithCancel}
                />
            )}
            <WipeDeviceStack.Screen
                name={WipeDeviceStackRoutes.ContinueOnTrezor}
                component={WipeDeviceContinueOnTrezorScreen}
            />
            <WipeDeviceStack.Screen
                name={WipeDeviceStackRoutes.WipeDeviceLoadingScreen}
                component={WipeDeviceLoadingScreen}
            />
            <WipeDeviceStack.Screen
                name={WipeDeviceStackRoutes.FactoryReset}
                component={FactoryResetScreen}
            />
        </WipeDeviceStack.Navigator>
    );
};
