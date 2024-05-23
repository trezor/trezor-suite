import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { useHandleDuplicatePassphrase } from '@suite-native/passphrase';

import { PassphraseFormScreen } from '../screens/PassphraseFormScreen';
import { PassphraseLoadingScreen } from '../screens/PassphraseLoadingScreen';
import { PassphraseConfirmOnTrezorScreen } from '../screens/PassphraseConfirmOnTrezorScreen';
import { PassphraseEmptyWalletScreen } from '../screens/PassphraseEmptyWalletScreen';
import { PassphraseVerifyEmptyWalletScreen } from '../screens/PassphraseVerifyEmptyWalletScreen';
import { PassphraseEnterOnTrezorScreen } from '../screens/PassphraseEnterOnTrezorScreen';
import { PassphraseEnableOnDeviceScreen } from '../screens/PassphraseEnableOnDeviceScreen';

export const PassphraseStack = createNativeStackNavigator<PassphraseStackParamList>();

export const PassphraseStackNavigator = () => {
    useHandleDuplicatePassphrase();

    return (
        <PassphraseStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            <PassphraseStack.Screen
                name={PassphraseStackRoutes.PassphraseForm}
                component={PassphraseFormScreen}
            />
            <PassphraseStack.Screen
                name={PassphraseStackRoutes.PassphraseConfirmOnTrezor}
                component={PassphraseConfirmOnTrezorScreen}
            />
            <PassphraseStack.Screen
                name={PassphraseStackRoutes.PassphraseLoading}
                component={PassphraseLoadingScreen}
            />
            <PassphraseStack.Screen
                name={PassphraseStackRoutes.PassphraseEmptyWallet}
                component={PassphraseEmptyWalletScreen}
            />
            <PassphraseStack.Screen
                name={PassphraseStackRoutes.PassphraseVerifyEmptyWallet}
                component={PassphraseVerifyEmptyWalletScreen}
            />
            <PassphraseStack.Screen
                name={PassphraseStackRoutes.PassphraseEnterOnTrezor}
                component={PassphraseEnterOnTrezorScreen}
            />
            <PassphraseStack.Screen
                name={PassphraseStackRoutes.PassphraseEnableOnDevice}
                component={PassphraseEnableOnDeviceScreen}
            />
        </PassphraseStack.Navigator>
    );
};
