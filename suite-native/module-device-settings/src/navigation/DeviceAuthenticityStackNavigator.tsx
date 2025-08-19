import { useCallback, useEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useDeviceAuthenticityCheck } from '@suite-native/device';
import {
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { useDeviceConnectionGuard } from '../hooks/useDeviceConnectionGuard';
import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceAuthenticitySuccessScreen } from '../screens/DeviceAuthenticitySuccessScreen';

const DeviceAuthenticityStack = createNativeStackNavigator<DeviceAuthenticityStackParamList>();

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceAuthenticityStack,
    RootStackParamList
>;

export const DeviceAuthenticityStackNavigator = () => {
    const [isAuthenticityCheckStarted, setIsAuthenticityCheckStarted] = useState(false);
    const navigation = useNavigation<NavigationProp>();
    const handleSuccess = useCallback(() => {
        navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
            screen: DeviceSettingsStackRoutes.DeviceAuthenticityStack,
            params: {
                screen: DeviceAuthenticityStackRoutes.AuthenticitySuccess,
            },
        });
    }, [navigation]);

    const { checkDeviceAuthenticity } = useDeviceAuthenticityCheck();
    const { isDeviceConnected } = useDeviceConnectionGuard();

    useEffect(() => {
        if (isDeviceConnected && !isAuthenticityCheckStarted) {
            setIsAuthenticityCheckStarted(true);
            checkDeviceAuthenticity(handleSuccess);
        }
    }, [checkDeviceAuthenticity, handleSuccess, isAuthenticityCheckStarted, isDeviceConnected]);

    if (!isDeviceConnected) return;

    return (
        <DeviceAuthenticityStack.Navigator
            initialRouteName={DeviceAuthenticityStackRoutes.AuthenticityCheck}
            screenOptions={stackNavigationOptionsConfig}
        >
            <DeviceAuthenticityStack.Screen
                name={DeviceAuthenticityStackRoutes.AuthenticityCheck}
                component={ContinueOnTrezorScreen}
            />
            <DeviceAuthenticityStack.Screen
                name={DeviceAuthenticityStackRoutes.AuthenticitySuccess}
                component={DeviceAuthenticitySuccessScreen}
            />
        </DeviceAuthenticityStack.Navigator>
    );
};
