import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useDisableDeviceConnectionOnFocus } from '@suite-native/device';
import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { AnalyticsConsentScreen } from '../screens/AnalyticsConsentScreen';
import { BiometricsScreen } from '../screens/BiometricsScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';

export const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingStackNavigator = () => {
    useDisableDeviceConnectionOnFocus();

    return (
        <OnboardingStack.Navigator
            initialRouteName={OnboardingStackRoutes.Welcome}
            screenOptions={stackNavigationOptionsConfig}
        >
            <OnboardingStack.Screen
                name={OnboardingStackRoutes.Welcome}
                component={WelcomeScreen}
            />
            <OnboardingStack.Screen
                name={OnboardingStackRoutes.AnalyticsConsent}
                component={AnalyticsConsentScreen}
            />
            <OnboardingStack.Screen
                name={OnboardingStackRoutes.Biometrics}
                component={BiometricsScreen}
            />
        </OnboardingStack.Navigator>
    );
};
