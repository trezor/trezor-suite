import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { selectDeviceRequestedPin } from '@suite-common/wallet-core';
import { useDetectDeviceError, useReportDeviceConnectToAnalytics } from '@suite-native/device';
import { useHandleDuplicatePassphrase } from '@suite-native/passphrase';

import { ConnectAndUnlockDeviceScreen } from '../screens/connect/ConnectAndUnlockDeviceScreen';
import { PinScreen } from '../screens/connect/PinScreen';
import { ConnectingDeviceScreen } from '../screens/connect/ConnectingDeviceScreen';
import { PassphraseEnterOnTrezorScreen } from '../screens/passphrase/PassphraseEnterOnTrezorScreen';
import { PassphraseEnableOnDeviceScreen } from '../screens/passphrase/PassphraseEnableOnDeviceScreen';
import { PassphraseFeatureUnlockScreen } from '../screens/passphrase/PassphraseFeatureUnlockScreen';
import { PassphraseVerifyEmptyWalletScreen } from '../screens/passphrase/PassphraseVerifyEmptyWalletScreen';
import { PassphraseEmptyWalletScreen } from '../screens/passphrase/PassphraseEmptyWalletScreen';
import { PassphraseLoadingScreen } from '../screens/passphrase/PassphraseLoadingScreen';
import { PassphraseConfirmOnTrezorScreen } from '../screens/passphrase/PassphraseConfirmOnTrezorScreen';
import { PassphraseFormScreen } from '../screens/passphrase/PassphraseFormScreen';

export const ConnectDeviceStack = createNativeStackNavigator<ConnectDeviceStackParamList>();

export const ConnectDeviceStackNavigator = () => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    useDetectDeviceError();
    useReportDeviceConnectToAnalytics();
    useHandleDuplicatePassphrase();

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

            <ConnectDeviceStack.Screen
                name={ConnectDeviceStackRoutes.PassphraseForm}
                component={PassphraseFormScreen}
            />
            <ConnectDeviceStack.Screen
                name={ConnectDeviceStackRoutes.PassphraseConfirmOnTrezor}
                component={PassphraseConfirmOnTrezorScreen}
            />
            <ConnectDeviceStack.Screen
                name={ConnectDeviceStackRoutes.PassphraseLoading}
                component={PassphraseLoadingScreen}
            />
            <ConnectDeviceStack.Screen
                name={ConnectDeviceStackRoutes.PassphraseEmptyWallet}
                component={PassphraseEmptyWalletScreen}
            />
            <ConnectDeviceStack.Screen
                name={ConnectDeviceStackRoutes.PassphraseVerifyEmptyWallet}
                component={PassphraseVerifyEmptyWalletScreen}
            />
            <ConnectDeviceStack.Screen
                name={ConnectDeviceStackRoutes.PassphraseEnterOnTrezor}
                component={PassphraseEnterOnTrezorScreen}
            />
            <ConnectDeviceStack.Screen
                name={ConnectDeviceStackRoutes.PassphraseEnableOnDevice}
                component={PassphraseEnableOnDeviceScreen}
            />
            <ConnectDeviceStack.Screen
                name={ConnectDeviceStackRoutes.PassphraseFeatureUnlockScreen}
                component={PassphraseFeatureUnlockScreen}
            />
        </ConnectDeviceStack.Navigator>
    );
};
