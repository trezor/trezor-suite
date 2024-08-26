import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { AddCoinAccountScreen } from '../screens/AddCoinAccountScreen';
import { SelectAccountTypeScreen } from '../screens/SelectAccountTypeScreen';
import { AddCoinDiscoveryFinishedScreen } from '../screens/AddCoinDiscoveryFinishedScreen';
import { AddCoinDiscoveryRunningScreen } from '../screens/AddCoinDiscoveryRunningScreen';

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
        <AddCoinAccountStack.Screen
            options={{ title: AddCoinAccountStackRoutes.SelectAccountType }}
            name={AddCoinAccountStackRoutes.SelectAccountType}
            component={SelectAccountTypeScreen}
        />
        <AddCoinAccountStack.Screen
            options={{ title: AddCoinAccountStackRoutes.AddCoinDiscoveryRunning }}
            name={AddCoinAccountStackRoutes.AddCoinDiscoveryRunning}
            component={AddCoinDiscoveryRunningScreen}
        />
        <AddCoinAccountStack.Screen
            options={{ title: AddCoinAccountStackRoutes.AddCoinDiscoveryFinished }}
            name={AddCoinAccountStackRoutes.AddCoinDiscoveryFinished}
            component={AddCoinDiscoveryFinishedScreen}
        />
    </AddCoinAccountStack.Navigator>
);
