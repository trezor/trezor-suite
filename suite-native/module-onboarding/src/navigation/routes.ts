import { StackNavigationProp } from '@react-navigation/stack';

export enum OnboardingStackRoutes {
    Onboarding = 'Onboarding',
    OnboardingXPub = 'OnboardingXPub',
    OnboardingAssets = 'OnboardingAssets',
}

export type OnboardingStackParamList = {
    [OnboardingStackRoutes.Onboarding]: undefined;
    [OnboardingStackRoutes.OnboardingXPub]: undefined;
    [OnboardingStackRoutes.OnboardingAssets]: {
        xpubAddress: string;
        coin: string;
    };
};

export type OnboardingScreenProp = StackNavigationProp<
    OnboardingStackParamList,
    OnboardingStackRoutes.Onboarding
>;
