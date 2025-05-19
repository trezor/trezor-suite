import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    selectDeviceRequestedPin,
    useHandleDuplicatePassphrase,
} from '@suite-native/device-authorization';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { PassphraseStackNavigator } from './PassphraseStackNavigator';
import { ConnectAndUnlockDeviceScreen } from '../screens/connect/ConnectAndUnlockDeviceScreen';
import { ConnectingDeviceScreen } from '../screens/connect/ConnectingDeviceScreen';
import { PinScreen } from '../screens/connect/PinScreen';

export const AuthorizeDeviceStack = createNativeStackNavigator<AuthorizeDeviceStackParamList>();

export const AuthorizeDeviceStackNavigator = () => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    useHandleDuplicatePassphrase();

    return (
        <AuthorizeDeviceStack.Navigator
            screenOptions={{ ...stackNavigationOptionsConfig, gestureEnabled: false }}
        >
            {
                // For proper screen transitions on both cancel and success PIN entry
                // we need to remove those screens from the stack so we can navigate
                // directly to the next screen without jumping back and forth.
                !hasDeviceRequestedPin && (
                    <AuthorizeDeviceStack.Group>
                        <AuthorizeDeviceStack.Screen
                            name={AuthorizeDeviceStackRoutes.ConnectingDevice}
                            component={ConnectingDeviceScreen}
                        />
                        <AuthorizeDeviceStack.Screen
                            name={AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice}
                            component={ConnectAndUnlockDeviceScreen}
                        />
                    </AuthorizeDeviceStack.Group>
                )
            }
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PinMatrix}
                component={PinScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseForm}
                component={PassphraseStackNavigator}
            />
        </AuthorizeDeviceStack.Navigator>
    );
};
