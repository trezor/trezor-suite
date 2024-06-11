import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceAuthenticationStackParamList,
    DeviceAuthenticationStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { selectDeviceRequestedPin } from '@suite-native/device-authentication';
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

export const DeviceAuthenticationStack =
    createNativeStackNavigator<DeviceAuthenticationStackParamList>();

export const DeviceAuthenticationStackNavigator = () => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    useDetectDeviceError();
    useReportDeviceConnectToAnalytics();
    useHandleDuplicatePassphrase();

    return (
        <DeviceAuthenticationStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {
                // For proper screen transitions on both cancel and success PIN entry
                // we need to remove those screens from the stack so we can navigate
                // directly to the next screen without jumping back and forth.
                !hasDeviceRequestedPin && (
                    <DeviceAuthenticationStack.Group>
                        <DeviceAuthenticationStack.Screen
                            name={DeviceAuthenticationStackRoutes.ConnectingDevice}
                            component={ConnectingDeviceScreen}
                        />
                        <DeviceAuthenticationStack.Screen
                            name={DeviceAuthenticationStackRoutes.ConnectAndUnlockDevice}
                            component={ConnectAndUnlockDeviceScreen}
                        />
                    </DeviceAuthenticationStack.Group>
                )
            }
            <DeviceAuthenticationStack.Screen
                name={DeviceAuthenticationStackRoutes.PinMatrix}
                component={PinScreen}
            />
            <DeviceAuthenticationStack.Screen
                name={DeviceAuthenticationStackRoutes.PassphraseForm}
                component={PassphraseFormScreen}
            />
            <DeviceAuthenticationStack.Screen
                name={DeviceAuthenticationStackRoutes.PassphraseConfirmOnTrezor}
                component={PassphraseConfirmOnTrezorScreen}
            />
            <DeviceAuthenticationStack.Screen
                name={DeviceAuthenticationStackRoutes.PassphraseLoading}
                component={PassphraseLoadingScreen}
            />
            <DeviceAuthenticationStack.Screen
                name={DeviceAuthenticationStackRoutes.PassphraseEmptyWallet}
                component={PassphraseEmptyWalletScreen}
            />
            <DeviceAuthenticationStack.Screen
                name={DeviceAuthenticationStackRoutes.PassphraseVerifyEmptyWallet}
                component={PassphraseVerifyEmptyWalletScreen}
            />
            <DeviceAuthenticationStack.Screen
                name={DeviceAuthenticationStackRoutes.PassphraseEnterOnTrezor}
                component={PassphraseEnterOnTrezorScreen}
            />
            <DeviceAuthenticationStack.Screen
                name={DeviceAuthenticationStackRoutes.PassphraseEnableOnDevice}
                component={PassphraseEnableOnDeviceScreen}
            />
            <DeviceAuthenticationStack.Screen
                name={DeviceAuthenticationStackRoutes.PassphraseFeatureUnlockScreen}
                component={PassphraseFeatureUnlockScreen}
            />
        </DeviceAuthenticationStack.Navigator>
    );
};
