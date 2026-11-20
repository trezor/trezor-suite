import { type FlagsRootState, selectIsOnboardingFeedbackBannerShown } from '@suite/flags';
import { selectAllAccountsToList } from '@suite-common/wallet-core';

import {
    type DiscoveryOverallStatusState,
    selectDiscoveryOverallStatus,
} from '#src/utils/wallet/selectDiscoveryOverallStatus';

type OnboardingFeedbackBannerState = FlagsRootState & DiscoveryOverallStatusState;

// The onboarding feedback banner is shown after onboarding is completed, as long as the device
// has no funds yet. It takes precedence over the dashboard promo banner, so the promo banner is
// hidden while this one is eligible.
export const selectShouldShowOnboardingFeedbackBanner = (state: OnboardingFeedbackBannerState) => {
    const isBannerShown = selectIsOnboardingFeedbackBannerShown(state);
    const accounts = selectAllAccountsToList(state);
    const discoveryStatus = selectDiscoveryOverallStatus(state);

    const isDeviceEmpty = accounts.every(account => account.empty);

    return isBannerShown && isDeviceEmpty && discoveryStatus?.status !== 'loading';
};
