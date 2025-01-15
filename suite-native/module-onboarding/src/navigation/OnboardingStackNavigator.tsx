import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { AnalyticsConsentScreen } from '../screens/AnalyticsConsentScreen';

export const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingStackNavigator = () => (
    <OnboardingStack.Navigator
        initialRouteName={OnboardingStackRoutes.Welcome}
        screenOptions={stackNavigationOptionsConfig}
    >
        <OnboardingStack.Screen name={OnboardingStackRoutes.Welcome} component={WelcomeScreen} />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.AnalyticsConsent}
            component={AnalyticsConsentScreen}
        />
    </OnboardingStack.Navigator>
);
