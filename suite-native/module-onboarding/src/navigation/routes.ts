import { StackNavigationProp } from '@react-navigation/stack';

import { AccountInfo } from '@trezor/connect';

export enum OnboardingStackRoutes {
    Onboarding = 'Onboarding',
    OnboardingXPub = 'OnboardingXPub',
    OnboardingFetching = 'OnboardingFetching',
    OnboardingAssets = 'OnboardingAssets',
}

export type OnboardingStackParamList = {
    [OnboardingStackRoutes.Onboarding]: undefined;
    [OnboardingStackRoutes.OnboardingXPub]: undefined;
    [OnboardingStackRoutes.OnboardingFetching]: {
        xpubAddress: string;
        network: string;
    };
    [OnboardingStackRoutes.OnboardingAssets]: {
        accountInfo: AccountInfo;
    };
};

export type OnboardingScreenProp = StackNavigationProp<
    OnboardingStackParamList,
    OnboardingStackRoutes.Onboarding
>;
