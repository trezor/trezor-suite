import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    LegacyOnboardingStackRoutes,
    LegacyOnboardingStackParamList,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { TrackBalancesScreen } from '../screens/TrackBalancesScreen';
import { FeatureReceiveScreen } from '../screens/FeatureReceiveScreen';
import { AnalyticsConsentScreen } from '../screens/AnalyticsConsentScreen';
import { ConnectTrezorScreen } from '../screens/ConnectTrezorScreen';

export const OnboardingStack = createNativeStackNavigator<LegacyOnboardingStackParamList>();

export const OnboardingStackNavigator = () => (
    <OnboardingStack.Navigator
        initialRouteName={LegacyOnboardingStackRoutes.Welcome}
        screenOptions={stackNavigationOptionsConfig}
    >
        <OnboardingStack.Screen
            name={LegacyOnboardingStackRoutes.Welcome}
            component={WelcomeScreen}
        />
        <OnboardingStack.Screen
            name={LegacyOnboardingStackRoutes.TrackBalances}
            component={TrackBalancesScreen}
        />
        <OnboardingStack.Screen
            name={LegacyOnboardingStackRoutes.AboutReceiveCoinsFeature}
            component={FeatureReceiveScreen}
        />
        <OnboardingStack.Screen
            name={LegacyOnboardingStackRoutes.ConnectTrezor}
            component={ConnectTrezorScreen}
        />
        <OnboardingStack.Screen
            name={LegacyOnboardingStackRoutes.AnalyticsConsent}
            component={AnalyticsConsentScreen}
        />
    </OnboardingStack.Navigator>
);
