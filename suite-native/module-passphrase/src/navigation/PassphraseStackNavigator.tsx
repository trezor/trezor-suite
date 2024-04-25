import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { PassphraseFormScreen } from '../screens/PassphraseFormScreen';
import { PassphraseLoadingScreen } from '../screens/PassphraseLoadingScreen';
import { PassphraseConfirmOnDeviceScreen } from '../screens/PassphraseConfirmOnDeviceScreen';

export const PassphraseStack = createNativeStackNavigator<PassphraseStackParamList>();

export const PassphraseStackNavigator = () => {
    return (
        <PassphraseStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            <PassphraseStack.Screen
                name={PassphraseStackRoutes.PassphraseForm}
                component={PassphraseFormScreen}
            />
            <PassphraseStack.Screen
                name={PassphraseStackRoutes.PassphraseConfirmOnDevice}
                component={PassphraseConfirmOnDeviceScreen}
            />
            <PassphraseStack.Screen
                name={PassphraseStackRoutes.PassphraseLoading}
                component={PassphraseLoadingScreen}
            />
        </PassphraseStack.Navigator>
    );
};
