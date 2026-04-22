import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type YieldStackParamList,
    YieldStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { HowYieldWorksScreen } from '../screens/HowYieldWorksScreen';
import { YieldConsentsScreen } from '../screens/YieldConsentsScreen';

const YiledStack = createNativeStackNavigator<YieldStackParamList>();

export const YieldStackNavigator = () => (
    <YiledStack.Navigator
        screenOptions={stackNavigationOptionsConfig}
        initialRouteName={YieldStackRoutes.HowYieldWorks}
    >
        <YiledStack.Screen
            options={{ title: YieldStackRoutes.HowYieldWorks }}
            name={YieldStackRoutes.HowYieldWorks}
            component={HowYieldWorksScreen}
        />
        <YiledStack.Screen
            options={{ title: YieldStackRoutes.YieldConsents }}
            name={YieldStackRoutes.YieldConsents}
            component={YieldConsentsScreen}
        />
    </YiledStack.Navigator>
);
