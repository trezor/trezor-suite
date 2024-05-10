import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { PassphraseFormScreen } from '../screens/PassphraseFormScreen';
import { PassphraseLoadingScreen } from '../screens/PassphraseLoadingScreen';
import { PassphraseConfirmOnTrezorScreen } from '../screens/PassphraseConfirmOnTrezorScreen';
import { PassphraseEmptyWalletScreen } from '../screens/PassphraseEmptyWalletScreen';
import { PassphraseVerifyEmptyWalletScreen } from '../screens/PassphraseVerifyEmptyWalletScreen';
import { PassphraseEnterOnTrezorScreen } from '../screens/PassphraseEnterOnTrezorScreen';

export const PassphraseStack = createNativeStackNavigator<PassphraseStackParamList>();

export const PassphraseStackNavigator = () => {
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
        </PassphraseStack.Navigator>
    );
};
