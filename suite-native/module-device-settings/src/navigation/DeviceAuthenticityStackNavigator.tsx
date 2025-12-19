import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsDeviceConnected } from '@suite-common/wallet-core';
import { useDeviceAuthenticityCheck } from '@suite-native/device';
import { DeviceConnectionGuardScreen } from '@suite-native/device-authorization';
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

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceAuthenticitySuccessScreen } from '../screens/DeviceAuthenticitySuccessScreen';

const DeviceAuthenticityStack = createNativeStackNavigator<DeviceAuthenticityStackParamList>();

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceAuthenticityStack,
    RootStackParamList
>;

export const DeviceAuthenticityStackNavigator = () => {
    const navigation = useNavigation<NavigationProp>();

    const { checkDeviceAuthenticity } = useDeviceAuthenticityCheck();
    const [isAuthenticityCheckStarted, setIsAuthenticityCheckStarted] = useState(false);

    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const handleSuccess = useCallback(() => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceAuthenticityStack, {
            screen: DeviceAuthenticityStackRoutes.AuthenticitySuccess,
        });
    }, [navigation]);

    const handleFailure = useCallback(() => {
        navigation.navigate(RootStackRoutes.DeviceCompromisedModal);
    }, [navigation]);

    useEffect(() => {
        if (isDeviceConnected && !isAuthenticityCheckStarted) {
            setIsAuthenticityCheckStarted(true);
            checkDeviceAuthenticity({ handleSuccess, handleFailure });
        }
    }, [
        checkDeviceAuthenticity,
        handleSuccess,
        handleFailure,
        isAuthenticityCheckStarted,
        isDeviceConnected,
    ]);

    return (
        <DeviceAuthenticityStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {!isDeviceConnected && (
                <DeviceAuthenticityStack.Screen
                    name={DeviceAuthenticityStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            {isDeviceConnected && (
                <DeviceAuthenticityStack.Screen
                    name={DeviceAuthenticityStackRoutes.AuthenticityCheck}
                    component={ContinueOnTrezorScreen}
                />
            )}
            <DeviceAuthenticityStack.Screen
                name={DeviceAuthenticityStackRoutes.AuthenticitySuccess}
                component={DeviceAuthenticitySuccessScreen}
            />
        </DeviceAuthenticityStack.Navigator>
    );
};
