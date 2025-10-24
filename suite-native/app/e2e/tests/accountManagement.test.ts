import { expect as detoxExpect } from 'detox';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import {
    PRELOADED_BTC_ACCOUNT_LABEL,
    portfolioTrackerBtcAccountState,
} from '../fixtures/portfolioTrackerBtcAccountState';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountDetailSettings } from '../pageObjects/accountDetailSettingsActions';
import { onHome } from '../pageObjects/homeActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    portfolioTrackerBtcAccountState,
);

describe('Account management [@noDevice]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await onHome.assertIsPortfolioGraphVisible();
    });

    it('Import account and rename it', async () => {
        await onTabBar.navigateToMyAssets();

        const newAccountName = 'BTC Renamed SegWit';
        await onMyAssets.openAccountDetail({ accountName: PRELOADED_BTC_ACCOUNT_LABEL });
        await onAccountDetail.openSettings();

        await onAccountDetailSettings.renameAccount({ newAccountName });

        await detoxExpect(element(by.id('@screen/sub-header/title'))).toHaveText(newAccountName);
    });

    it('Import account and remove it', async () => {
        await onTabBar.navigateToMyAssets();
        await onMyAssets.openAccountDetail({ accountName: PRELOADED_BTC_ACCOUNT_LABEL });
        await onAccountDetail.openSettings();
        await onAccountDetailSettings.removeAccount();
        await onTabBar.navigateToMyAssets();

        await detoxExpect(element(by.text(PRELOADED_BTC_ACCOUNT_LABEL))).not.toExist();
    });
});
