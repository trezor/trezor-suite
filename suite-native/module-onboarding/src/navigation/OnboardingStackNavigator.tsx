import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { TrackBalancesScreen } from '../screens/TrackBalancesScreen';
import { FeatureReceiveScreen } from '../screens/FeatureReceiveScreen';
import { AnalyticsConsentScreen } from '../screens/AnalyticsConsentScreen';
import { GetStartedScreen } from '../screens/GetStartedScreen';

export const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingStackNavigator = () => (
    <OnboardingStack.Navigator
        initialRouteName={OnboardingStackRoutes.Welcome}
        screenOptions={stackNavigationOptionsConfig}
    >
        <OnboardingStack.Screen name={OnboardingStackRoutes.Welcome} component={WelcomeScreen} />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.TrackBalances}
            component={TrackBalancesScreen}
        />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.AboutReceiveCoinsFeature}
            component={FeatureReceiveScreen}
        />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.AnalyticsConsent}
            component={AnalyticsConsentScreen}
        />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.GetStarted}
            component={GetStartedScreen}
        />
    </OnboardingStack.Navigator>
);
