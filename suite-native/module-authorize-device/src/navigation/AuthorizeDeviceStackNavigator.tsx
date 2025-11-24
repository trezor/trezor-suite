import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsDeviceThpRequired } from '@suite-common/wallet-core';
import { CoinEnablingInitScreen } from '@suite-native/coin-enabling';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { PassphraseStackNavigator } from './PassphraseStackNavigator';
import { ConnectAndUnlockDeviceScreen } from '../screens/connect/ConnectAndUnlockDeviceScreen';
import { ConnectBluetoothDeviceScreen } from '../screens/connect/ConnectBluetoothDeviceScreen';
import { ConnectDeviceCrossroadsScreen } from '../screens/connect/ConnectDeviceCrossroadsScreen';
import { ConnectingDeviceScreen } from '../screens/connect/ConnectingDeviceScreen';
import { DeviceConnectionGuardScreen } from '../screens/connect/DeviceConnectionGuardScreen';
import { PinScreen } from '../screens/connect/PinScreen';
import { RemoveBluetoothDeviceScreen } from '../screens/connect/RemoveBluetoothDeviceScreen';
import { TurnOnAndUnlockDeviceScreen } from '../screens/connect/TurnOnAndUnlockDeviceScreen';
import { PassphraseConfirmFeatureUnlockEnterOnTrezorScreen } from '../screens/passphrase/PassphraseConfirmFeatureUnlockEnterOnTrezorScreen';
import { PassphraseConfirmFeatureUnlockOnTrezorScreen } from '../screens/passphrase/PassphraseConfirmFeatureUnlockOnTrezorScreen';
import { PassphraseFeatureUnlockFormScreen } from '../screens/passphrase/PassphraseFeatureUnlockFormScreen';
import { ThpCodeEntryScreen } from '../screens/thp/ThpCodeEntryScreen';
import { ThpConfirmationScreen } from '../screens/thp/ThpConfirmationScreen';

export const AuthorizeDeviceStack = createNativeStackNavigator<AuthorizeDeviceStackParamList>();

export const AuthorizeDeviceStackNavigator = () => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const isDeviceThpRequired = useSelector(selectIsDeviceThpRequired);

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
                            name={AuthorizeDeviceStackRoutes.DeviceConnectionGuard}
                            component={DeviceConnectionGuardScreen}
                        />
                        <AuthorizeDeviceStack.Screen
                            name={AuthorizeDeviceStackRoutes.ConnectDeviceCrossroads}
                            component={ConnectDeviceCrossroadsScreen}
                        />
                        <AuthorizeDeviceStack.Screen
                            name={AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice}
                            component={ConnectAndUnlockDeviceScreen}
                        />
                        <AuthorizeDeviceStack.Screen
                            name={AuthorizeDeviceStackRoutes.TurnOnAndUnlockDevice}
                            component={TurnOnAndUnlockDeviceScreen}
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
                component={PassphraseConfirmFeatureUnlockEnterOnTrezorScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseConfirmFeatureUnlockOnTrezor}
                component={PassphraseConfirmFeatureUnlockOnTrezorScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.CoinEnablingInit}
                component={CoinEnablingInitScreen}
            />
        </AuthorizeDeviceStack.Navigator>
    );
};
