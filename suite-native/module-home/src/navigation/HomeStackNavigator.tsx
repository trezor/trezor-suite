import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    HomeStackParamList,
    HomeStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { HomeScreen } from '../screens/HomeScreen/HomeScreen';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStackNavigator = () => (
    <HomeStack.Navigator
        initialRouteName={HomeStackRoutes.Home}
        screenOptions={stackNavigationOptionsConfig}
    >
        <HomeStack.Screen
            options={{ title: HomeStackRoutes.Home }}
            name={HomeStackRoutes.Home}
            component={HomeScreen}
        />
    </HomeStack.Navigator>
);
