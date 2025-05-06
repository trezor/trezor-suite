import { useCallback, useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useDeviceAuthenticityCheck } from '@suite-native/device';
import {
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList,
    StackToStackCompositeNavigationProps,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { useDeviceConnectionGuard } from '../hooks/useDeviceConnectionGuard';
import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceAuthenticitySuccessScreen } from '../screens/DeviceAuthenticitySuccessScreen';

const DeviceAuthenticityStack = createNativeStackNavigator<DeviceAuthenticityStackParamList>();

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList
>;

export const DeviceAuthenticityStackNavigator = () => {
    const navigation = useNavigation<NavigationProp>();
    const handleSuccess = useCallback(() => {
        navigation.navigate(DeviceAuthenticityStackRoutes.AuthenticitySuccess);
    }, [navigation]);

    const { checkDeviceAuthenticity } = useDeviceAuthenticityCheck();
    const { isDeviceConnected } = useDeviceConnectionGuard();

    useEffect(() => {
        if (isDeviceConnected) checkDeviceAuthenticity(handleSuccess);

        // checkDeviceAuthenticity is excluded as it depends on device object that could unintentionally trigger the useEffect
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDeviceConnected, handleSuccess]);

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
