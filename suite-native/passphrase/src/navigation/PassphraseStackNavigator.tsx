import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { PassphraseFormScreen } from '../screens/PassphraseFormScreen';

export const PassphraseStack = createNativeStackNavigator<PassphraseStackParamList>();

export const PassphraseStackNavigator = () => {
    return (
        <PassphraseStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            <PassphraseStack.Screen
                name={PassphraseStackRoutes.PassphraseForm}
                component={PassphraseFormScreen}
            />
        </PassphraseStack.Navigator>
    );
};
