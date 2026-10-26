import { expect as detoxExpect } from 'detox';

import { getTranslation } from '@suite-native/intl';

import { tokenReceiveTokenUSDC } from '../fixtures/connect/tokenReceiveAccountInfoUSDC';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import {
    PRELOADED_TOKEN_ACCOUNT_LABEL,
    portfolioTrackerUSDCTokenAccount,
    portfolioTrackerUSDCTokenAccountState,
} from '../fixtures/portfolioTrackerUSDCTokenAccountState';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountReceive } from '../pageObjects/accountReceiveActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';
import { waitForVisible } from '../support/utils';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    portfolioTrackerUSDCTokenAccountState,
);

describe('Token Receive [@noDevice]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
    });

    it('Preserves token context when a positive-balance token has no fetched transactions', async () => {
        await onTabBar.navigateToMyAssets();
        await waitForVisible(by.text(PRELOADED_TOKEN_ACCOUNT_LABEL));
        await element(by.text(PRELOADED_TOKEN_ACCOUNT_LABEL)).tap();
        await waitForVisible(by.id('@screen/AccountOverview'));

        await waitForVisible(by.text(tokenReceiveTokenUSDC.name));
        await element(by.text(tokenReceiveTokenUSDC.name)).tap();
        await onAccountDetail.waitForScreen();
        await waitForVisible(by.text(getTranslation('transactions.emptyState.title')));

        await onAccountDetail.openReceive();
        await onAccountReceive.waitForScreen();
        const receiveScreen = by.id('@screen/ReceiveAddress');
        await detoxExpect(
            element(by.text(` - ${tokenReceiveTokenUSDC.symbol}`).withAncestor(receiveScreen)),
        ).toBeVisible();
        await detoxExpect(
            element(
                by
                    .label(
                        `${portfolioTrackerUSDCTokenAccount.symbol}:${tokenReceiveTokenUSDC.contract}`,
                    )
                    .withAncestor(receiveScreen),
            ),
        ).toBeVisible();
    });
});
