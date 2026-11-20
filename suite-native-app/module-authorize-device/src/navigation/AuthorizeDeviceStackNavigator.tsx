import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CoinEnablingInitScreen } from '@suite-native/coin-enabling';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { ConnectAndUnlockDeviceScreen } from '../screens/connect/ConnectAndUnlockDeviceScreen';
import { ConnectBluetoothDeviceScreen } from '../screens/connect/ConnectBluetoothDeviceScreen';
import { ConnectDeviceCrossroadsScreen } from '../screens/connect/ConnectDeviceCrossroadsScreen';
import { ConnectingDeviceScreen } from '../screens/connect/ConnectingDeviceScreen';
import { DeviceConnectionGuardScreen } from '../screens/connect/DeviceConnectionGuardScreen';
import { PinScreen } from '../screens/connect/PinScreen';
import { RemoveBluetoothDeviceScreen } from '../screens/connect/RemoveBluetoothDeviceScreen';
import { TurnOnAndUnlockDeviceScreen } from '../screens/connect/TurnOnAndUnlockDeviceScreen';
import { PassphraseConfirmOnTrezorScreen } from '../screens/passphrase/PassphraseConfirmOnTrezorScreen';
import { PassphraseEnterOnTrezorScreen } from '../screens/passphrase/PassphraseEnterOnTrezorScreen';
import { PassphraseFormScreen } from '../screens/passphrase/PassphraseFormScreen';
import { ThpCodeEntryScreen } from '../screens/thp/ThpCodeEntryScreen';
import { ThpConfirmationScreen } from '../screens/thp/ThpConfirmationScreen';

export const AuthorizeDeviceStack = createNativeStackNavigator<AuthorizeDeviceStackParamList>();

export const AuthorizeDeviceStackNavigator = () => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

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
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PinMatrix}
                component={PinScreen}
            />
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
                name={AuthorizeDeviceStackRoutes.PassphraseForm}
                component={PassphraseFormScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor}
                component={PassphraseEnterOnTrezorScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor}
                component={PassphraseConfirmOnTrezorScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.CoinEnablingInit}
                component={CoinEnablingInitScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.ContinueOnTrezor}
                component={ContinueOnTrezorScreen}
            />
        </AuthorizeDeviceStack.Navigator>
    );
};
