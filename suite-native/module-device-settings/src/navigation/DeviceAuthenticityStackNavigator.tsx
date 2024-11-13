import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceAuthenticitySummaryScreen } from '../screens/DeviceAuthenticitySummaryScreen';

const DeviceAuthenticityStack = createNativeStackNavigator<DeviceAuthenticityStackParamList>();

export const DeviceAuthenticityStackNavigator = () => (
    <DeviceAuthenticityStack.Navigator
        initialRouteName={DeviceAuthenticityStackRoutes.AuthenticityCheck}
        screenOptions={stackNavigationOptionsConfig}
    >
        <DeviceAuthenticityStack.Screen
            name={DeviceAuthenticityStackRoutes.AuthenticityCheck}
            component={ContinueOnTrezorScreen}
        />
        <DeviceAuthenticityStack.Screen
            name={DeviceAuthenticityStackRoutes.AuthenticitySummary}
            component={DeviceAuthenticitySummaryScreen}
        />
    </DeviceAuthenticityStack.Navigator>
);
