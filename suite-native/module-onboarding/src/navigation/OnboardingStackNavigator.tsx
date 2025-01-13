import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { WelcomeScreen } from '../screens/WelcomeScreen';

export const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingStackNavigator = () => (
    <OnboardingStack.Navigator
        initialRouteName={OnboardingStackRoutes.Welcome}
        screenOptions={stackNavigationOptionsConfig}
    >
        <OnboardingStack.Screen name={OnboardingStackRoutes.Welcome} component={WelcomeScreen} />
    </OnboardingStack.Navigator>
);
