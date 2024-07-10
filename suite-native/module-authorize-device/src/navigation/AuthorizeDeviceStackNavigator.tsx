import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import {
    selectDeviceRequestedPin,
    useHandleDuplicatePassphrase,
} from '@suite-native/device-authorization';
import { useDetectDeviceError, useReportDeviceConnectToAnalytics } from '@suite-native/device';

import { ConnectAndUnlockDeviceScreen } from '../screens/connect/ConnectAndUnlockDeviceScreen';
import { PinScreen } from '../screens/connect/PinScreen';
import { ConnectingDeviceScreen } from '../screens/connect/ConnectingDeviceScreen';
import { PassphraseFormScreen } from '../screens/passphrase/PassphraseFormScreen';
import { PassphraseLoadingScreen } from '../screens/passphrase/PassphraseLoadingScreen';
import { PassphraseEmptyWalletScreen } from '../screens/passphrase/PassphraseEmptyWalletScreen';
import { PassphraseEnterOnTrezorScreen } from '../screens/passphrase/PassphraseEnterOnTrezorScreen';
import { PassphraseVerifyEmptyWalletScreen } from '../screens/passphrase/PassphraseVerifyEmptyWalletScreen';
import { PassphraseEnableOnDeviceScreen } from '../screens/passphrase/PassphraseEnableOnDeviceScreen';
import { PassphraseConfirmOnTrezorScreen } from '../screens/passphrase/PassphraseConfirmOnTrezorScreen';
import { PassphraseFeatureUnlockFormScreen } from '../screens/passphrase/PassphraseFeatureUnlockFormScreen';

export const AuthorizeDeviceStack = createNativeStackNavigator<AuthorizeDeviceStackParamList>();

export const AuthorizeDeviceStackNavigator = () => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    useDetectDeviceError();
    useReportDeviceConnectToAnalytics();
    useHandleDuplicatePassphrase();

    return (
        <AuthorizeDeviceStack.Navigator screenOptions={stackNavigationOptionsConfig}>
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
                component={PassphraseFormScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseFeatureUnlockForm}
                component={PassphraseFeatureUnlockFormScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor}
                component={PassphraseConfirmOnTrezorScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseLoading}
                component={PassphraseLoadingScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseEmptyWallet}
                component={PassphraseEmptyWalletScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseVerifyEmptyWallet}
                component={PassphraseVerifyEmptyWalletScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor}
                component={PassphraseEnterOnTrezorScreen}
            />
            <AuthorizeDeviceStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseEnableOnDevice}
                component={PassphraseEnableOnDeviceScreen}
            />
        </AuthorizeDeviceStack.Navigator>
    );
};
