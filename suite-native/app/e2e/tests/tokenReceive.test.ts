import { expect as detoxExpect } from 'detox';

import { getTranslation } from '@suite-native/intl';

import { tokenReceiveToken } from '../fixtures/connect/tokenReceiveAccountInfo';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import {
    PRELOADED_TOKEN_ACCOUNT_LABEL,
    portfolioTrackerTokenAccount,
    portfolioTrackerTokenAccountState,
} from '../fixtures/portfolioTrackerTokenAccountState';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountReceive } from '../pageObjects/accountReceiveActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';
import { waitForVisible } from '../support/utils';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    portfolioTrackerTokenAccountState,
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

        await waitForVisible(by.text(tokenReceiveToken.name));
        await element(by.text(tokenReceiveToken.name)).tap();
        await onAccountDetail.waitForScreen();
        await waitForVisible(by.text(getTranslation('transactions.emptyState.title')));

        await onAccountDetail.openReceive();
        await onAccountReceive.waitForScreen();
        const receiveScreen = by.id('@screen/ReceiveAddress');
        await detoxExpect(
            element(by.text(` - ${tokenReceiveToken.symbol}`).withAncestor(receiveScreen)),
        ).toBeVisible();
        await detoxExpect(
            element(
                by
                    .label(`${portfolioTrackerTokenAccount.symbol}:${tokenReceiveToken.contract}`)
                    .withAncestor(receiveScreen),
            ),
        ).toBeVisible();
    });
});
