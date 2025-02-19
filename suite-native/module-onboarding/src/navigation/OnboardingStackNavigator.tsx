import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { AnalyticsConsentScreen } from '../screens/AnalyticsConsentScreen';
import { BiometricsScreen } from '../screens/BiometricsScreen';
import { FirmwareInstallationScreen } from '../screens/FirmwareInstallationScreen';
import { SecurityCheckScreen } from '../screens/SecurityCheckScreen';
import { SuspiciousDeviceScreen } from '../screens/SuspiciousDeviceScreen';
import { UninitializedDeviceLandingScreen } from '../screens/UninitializedDeviceLandingScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';

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
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.Biometrics}
            component={BiometricsScreen}
        />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.UninitializedDeviceLanding}
            component={UninitializedDeviceLandingScreen}
        />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.SuspiciousDevice}
            component={SuspiciousDeviceScreen}
        />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.SecurityCheck}
            component={SecurityCheckScreen}
        />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.FirmwareInstallationScreen}
            component={FirmwareInstallationScreen}
        />
    </OnboardingStack.Navigator>
);
