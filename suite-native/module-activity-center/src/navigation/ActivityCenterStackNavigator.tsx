import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type ActivityCenterStackParamList,
    ActivityCenterStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ActivityCenterScreen } from '../screens/ActivityCenterScreen';

const ActivityCenterStack = createNativeStackNavigator<ActivityCenterStackParamList>();

export const ActivityCenterStackNavigator = () => (
    <ActivityCenterStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <ActivityCenterStack.Screen
            name={ActivityCenterStackRoutes.ActivityCenter}
            component={ActivityCenterScreen}
        />
    </ActivityCenterStack.Navigator>
);
