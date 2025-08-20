import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    selectIsConnectedDeviceUninitialized,
    selectIsDeviceThpRequired,
} from '@suite-common/wallet-core';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { PassphraseStackNavigator } from './PassphraseStackNavigator';
import { ConnectAndUnlockDeviceScreen } from '../screens/connect/ConnectAndUnlockDeviceScreen';
import { ConnectBluetoothDeviceScreen } from '../screens/connect/ConnectBluetoothDeviceScreen';
import { ConnectingDeviceScreen } from '../screens/connect/ConnectingDeviceScreen';
import { PinScreen } from '../screens/connect/PinScreen';
import { RemoveBluetoothDeviceScreen } from '../screens/connect/RemoveBluetoothDeviceScreen';
import { TurnOnAndUnlockDeviceScreen } from '../screens/connect/TurnOnAndUnlockDeviceScreen';
import { PassphraseConfirmFeatureUnlockEnterOnTrezoreScreen } from '../screens/passphrase/PassphraseConfirmFeatureUnlockEnterOnTrezoreScreen';
import { PassphraseConfirmFeatureUnlockOnTrezorScreen } from '../screens/passphrase/PassphraseConfirmFeatureUnlockOnTrezorScreen';
import { PassphraseFeatureUnlockFormScreen } from '../screens/passphrase/PassphraseFeatureUnlockFormScreen';
import { ThpCodeEntryScreen } from '../screens/thp/ThpCodeEntryScreen';
import { ThpConfirmationScreen } from '../screens/thp/ThpConfirmationScreen';

export const AuthorizeDeviceStack = createNativeStackNavigator<AuthorizeDeviceStackParamList>();

export const AuthorizeDeviceStackNavigator = () => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const isDeviceThpRequired = useSelector(selectIsDeviceThpRequired);
    const isConnectedDeviceUninitialized = useSelector(selectIsConnectedDeviceUninitialized);

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
                !hasDeviceRequestedPin &&
                    !isDeviceThpRequired &&
                    !isConnectedDeviceUninitialized && (
                        <AuthorizeDeviceStack.Group>
                            <AuthorizeDeviceStack.Screen
                                name={AuthorizeDeviceStackRoutes.ConnectingDevice}
                                component={ConnectingDeviceScreen}
                            />
                            <AuthorizeDeviceStack.Screen
                                name={AuthorizeDeviceStackRoutes.TurnOnAndUnlockDevice}
                                component={TurnOnAndUnlockDeviceScreen}
                            />
                            <AuthorizeDeviceStack.Screen
                                name={AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice}
                                component={ConnectAndUnlockDeviceScreen}
                                options={{ animationTypeForReplace: 'pop' }}
                            />
                        </AuthorizeDeviceStack.Group>
                    )
            }
            {!isDeviceThpRequired && hasDeviceRequestedPin && (
                <AuthorizeDeviceStack.Screen
                    name={AuthorizeDeviceStackRoutes.PinMatrix}
                    component={PinScreen}
                />
            )}
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.ConnectBluetoothDevice}
                component={ConnectBluetoothDeviceScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.RemoveBluetoothDevice}
                component={RemoveBluetoothDeviceScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.ThpConfirmation}
                component={ThpConfirmationScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.ThpCodeEntry}
                component={ThpCodeEntryScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseFeatureUnlockForm}
                component={PassphraseFeatureUnlockFormScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor}
                component={PassphraseConfirmFeatureUnlockEnterOnTrezoreScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseConfirmFeatureUnlockOnTrezor}
                component={PassphraseConfirmFeatureUnlockOnTrezorScreen}
            />
        </AuthorizeDeviceStack.Navigator>
    );
};
