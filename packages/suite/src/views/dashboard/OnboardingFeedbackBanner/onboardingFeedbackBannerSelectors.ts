import { selectIsOnboardingFeedbackBannerShown } from '@suite/flags';
import { type NetworkConfigDeps } from '@suite-common/wallet-config';
import { selectAllAccountsToList } from '@suite-common/wallet-core';

import { type AppState } from 'src/types/suite';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

// The onboarding feedback banner is shown after onboarding is completed, as long as the device
// has no funds yet. It takes precedence over the dashboard promo banner, so the promo banner is
// hidden while this one is eligible.
export const selectShouldShowOnboardingFeedbackBanner = (
    state: AppState,
    networkConfigDeps: NetworkConfigDeps,
) => {
    const isBannerShown = selectIsOnboardingFeedbackBannerShown(state);
    const accounts = selectAllAccountsToList(state, networkConfigDeps);
    const discoveryStatus = selectDiscoveryOverallStatus(state);

    const isDeviceEmpty = accounts.every(account => account.empty);

    return isBannerShown && isDeviceEmpty && discoveryStatus?.status !== 'loading';
};
