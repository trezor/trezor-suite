import { useCallback, useEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useDeviceAuthenticityCheck } from '@suite-native/device';
import {
    DeviceConnectionGuardScreenWithCancel,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
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

    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();
    const { checkDeviceAuthenticity } = useDeviceAuthenticityCheck();
    const [isAuthenticityCheckStarted, setIsAuthenticityCheckStarted] = useState(false);

    const handleSuccess = useCallback(() => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceAuthenticityStack, {
            screen: DeviceAuthenticityStackRoutes.AuthenticitySuccess,
        });
    }, [navigation]);

    const handleFailure = useCallback(() => {
        navigation.navigate(RootStackRoutes.DeviceCompromisedModal, {
            failedCheck: 'device-authenticity',
        });
    }, [navigation]);

    useEffect(() => {
        if (!isDeviceConnectionGuardVisible && !isAuthenticityCheckStarted) {
            setIsAuthenticityCheckStarted(true);
            checkDeviceAuthenticity({ handleSuccess, handleFailure });
        }
    }, [
        isDeviceConnectionGuardVisible,
        isAuthenticityCheckStarted,
        checkDeviceAuthenticity,
        handleSuccess,
        handleFailure,
    ]);

    return (
        <DeviceAuthenticityStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <DeviceAuthenticityStack.Screen
                    name={DeviceAuthenticityStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreenWithCancel}
                />
            )}
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
