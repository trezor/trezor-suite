import { StackNavigationProp } from '@react-navigation/stack';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { XpubAddress } from '@suite-common/wallet-types';

export enum OnboardingStackRoutes {
    Onboarding = 'Onboarding',
    OnboardingXpubScan = 'OnboardingXpubScan',
    OnboardingAssets = 'OnboardingAssets',
}

export type OnboardingStackParamList = {
    [OnboardingStackRoutes.Onboarding]: undefined;
    [OnboardingStackRoutes.OnboardingXpubScan]: undefined;
    [OnboardingStackRoutes.OnboardingAssets]: {
        xpubAddress: XpubAddress;
        currencySymbol: NetworkSymbol;
    };
};

export type OnboardingScreenProp = StackNavigationProp<
    OnboardingStackParamList,
    OnboardingStackRoutes.Onboarding
>;
