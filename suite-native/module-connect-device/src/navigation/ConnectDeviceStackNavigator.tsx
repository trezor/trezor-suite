import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import { useDetectDeviceError, useReportDeviceConnectToAnalytics } from '@suite-native/device';

import { ConnectAndUnlockDeviceScreen } from '../screens/ConnectAndUnlockDeviceScreen';
import { PinScreen } from '../screens/PinScreen';
import { ConnectingDeviceScreen } from '../screens/ConnectingDeviceScreen';

export const ConnectDeviceStack = createNativeStackNavigator<ConnectDeviceStackParamList>();

export const ConnectDeviceStackNavigator = () => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    useDetectDeviceError();
    useReportDeviceConnectToAnalytics();

    return (
        <ConnectDeviceStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {
                // For proper screen transitions on both cancel and success PIN entry
                // we need to remove those screens from the stack so we can navigate
                // directly to the next screen without jumping back and forth.
                !hasDeviceRequestedPin && (
                    <ConnectDeviceStack.Group>
                        <ConnectDeviceStack.Screen
                            name={ConnectDeviceStackRoutes.ConnectingDevice}
                            component={ConnectingDeviceScreen}
                        />
                        <ConnectDeviceStack.Screen
                            name={ConnectDeviceStackRoutes.ConnectAndUnlockDevice}
                            component={ConnectAndUnlockDeviceScreen}
                        />
                    </ConnectDeviceStack.Group>
                )
            }
            <ConnectDeviceStack.Screen
                name={ConnectDeviceStackRoutes.PinMatrix}
                component={PinScreen}
            />
        </ConnectDeviceStack.Navigator>
    );
};
