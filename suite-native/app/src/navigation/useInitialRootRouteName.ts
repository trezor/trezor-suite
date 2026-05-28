import { useSelector } from 'react-redux';

import { RootStackRoutes } from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { selectShouldDisplayTradingResidenceOnboarding } from '@suite-native/trading-state';

export const useInitialRootRouteName = (): RootStackRoutes => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const shouldDisplayTradingResidenceOnboarding = useSelector(
        selectShouldDisplayTradingResidenceOnboarding,
    );

    if (!isOnboardingFinished) {
        return RootStackRoutes.OnboardingStack;
    }

    if (shouldDisplayTradingResidenceOnboarding) {
        return RootStackRoutes.TradingLocationModal;
    }

    return RootStackRoutes.AppTabs;
};
