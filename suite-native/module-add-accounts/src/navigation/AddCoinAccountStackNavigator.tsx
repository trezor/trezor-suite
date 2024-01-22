import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { AddCoinAccountScreen } from '../screens/AddCoinAccountScreen';

const AddCoinAccountStack = createNativeStackNavigator<AddCoinAccountStackParamList>();

export const AddCoinAccountStackNavigator = () => (
    <AddCoinAccountStack.Navigator
        initialRouteName={AddCoinAccountStackRoutes.AddCoinAccount}
        screenOptions={stackNavigationOptionsConfig}
    >
        <AddCoinAccountStack.Screen
            options={{ title: AddCoinAccountStackRoutes.AddCoinAccount }}
            name={AddCoinAccountStackRoutes.AddCoinAccount}
            component={AddCoinAccountScreen}
        />
    </AddCoinAccountStack.Navigator>
);
