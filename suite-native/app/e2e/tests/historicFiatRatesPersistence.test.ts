import {
    SENTINEL_FIAT_AMOUNT,
    SENTINEL_TX_ID,
    historicFiatRatesState,
} from '../fixtures/historicFiatRatesState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import {
    PRELOADED_BTC_ACCOUNT_LABEL,
    portfolioTrackerBtcAccountState,
} from '../fixtures/portfolioTrackerBtcAccountState';
import { onHome } from '../pageObjects/homeActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';
import { scrollUntilVisible, wait, waitToHaveRegex } from '../support/utils';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    portfolioTrackerBtcAccountState,
    historicFiatRatesState,
);

// The fiat slice is persisted with a 1s throttle, so a write can still be queued when the
// assertion passes. Outwait it before killing the app.
const PERSIST_SETTLE_MS = 3_000;

const openTransactionList = async () => {
    await onHome.assertIsPortfolioGraphVisible();
    await onTabBar.navigateToMyAssets();
    await onMyAssets.openAccountDetail({ accountName: PRELOADED_BTC_ACCOUNT_LABEL });
};

const expectSentinelFiatAmount = async () => {
    // The list sits below the graph, which cannot be dragged, so the row starts off screen.
    await scrollUntilVisible(element(by.id(`@transactions/item/${SENTINEL_TX_ID}`)), {
        startPositionY: 0.8,
    });

    await waitToHaveRegex(
        by.id(`@transactions/item/${SENTINEL_TX_ID}/fiatAmount`),
        new RegExp(SENTINEL_FIAT_AMOUNT.replace('.', '\\.')),
    );
};

describe('Historic fiat rates persistence [@noDevice]', () => {
    it('restores historic rates from storage instead of refetching them after a restart', async () => {
        await openApp({ args: { preloadedState } });
        await openTransactionList();
        await expectSentinelFiatAmount();

        await wait(PERSIST_SETTLE_MS);
        await device.terminateApp();

        // Keep the storage but preload nothing: the account, its transaction and the rate can now
        // only come from MMKV. The rate is deliberately one the API would never return, so seeing
        // it again also proves updateMissingTxFiatRatesThunk did not refetch over it.
        await openApp({ wipeData: false, args: {} });
        await openTransactionList();
        await expectSentinelFiatAmount();
    });
});
