import { StackNavigationProp } from '@react-navigation/stack';

export enum OnboardingStackRoutes {
    Onboarding = 'Onboarding',
    OnboardingXPub = 'OnboardingXPub',
}

export type OnboardingStackParamList = {
    [OnboardingStackRoutes.Onboarding]: undefined;
    [OnboardingStackRoutes.OnboardingXPub]: undefined;
};

export type OnboardingScreenProp = StackNavigationProp<
    OnboardingStackParamList,
    OnboardingStackRoutes.Onboarding
>;
