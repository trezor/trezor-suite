import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { PassphraseStackNavigator } from './PassphraseStackNavigator';
import { ConnectAndUnlockDeviceScreen } from '../screens/connect/ConnectAndUnlockDeviceScreen';
import { ConnectingDeviceScreen } from '../screens/connect/ConnectingDeviceScreen';
import { PinScreen } from '../screens/connect/PinScreen';
import { PassphraseEnterOnTrezorScreen } from '../screens/passphrase/PassphraseEnterOnTrezorScreen';
import { PassphraseFeatureUnlockFormScreen } from '../screens/passphrase/PassphraseFeatureUnlockFormScreen';

export const AuthorizeDeviceStack = createNativeStackNavigator<AuthorizeDeviceStackParamList>();

export const AuthorizeDeviceStackNavigator = () => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    return (
        <AuthorizeDeviceStack.Navigator
            screenOptions={{ ...stackNavigationOptionsConfig, gestureEnabled: false }}
        >
            {
                // NOTE: render this first as it handles states that should be on top - passphrase on device enable
            }
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseForm}
                component={PassphraseStackNavigator}
            />
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

            {hasDeviceRequestedPin && (
                <AuthorizeDeviceStack.Screen
                    name={AuthorizeDeviceStackRoutes.PinMatrix}
                    component={PinScreen}
                />
            )}

            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseFeatureUnlockForm}
                component={PassphraseFeatureUnlockFormScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor}
                component={PassphraseEnterOnTrezorScreen}
            />
        </AuthorizeDeviceStack.Navigator>
    );
};
