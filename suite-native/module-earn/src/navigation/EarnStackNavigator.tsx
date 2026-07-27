import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type EarnStackParamList,
    EarnStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { EarnScreen } from '../screens/EarnScreen';

const AccountsStack = createNativeStackNavigator<EarnStackParamList>();

export const EarnStackNavigator = () => (
    <AccountsStack.Navigator
        screenOptions={stackNavigationOptionsConfig}
        initialRouteName={EarnStackRoutes.Earn}
    >
        <AccountsStack.Screen
            options={{ title: EarnStackRoutes.Earn }}
            name={EarnStackRoutes.Earn}
            component={EarnScreen}
        />
    </AccountsStack.Navigator>
);
