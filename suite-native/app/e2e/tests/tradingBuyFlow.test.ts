import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onHome } from '../pageObjects/homeActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { buyPreviewActions } from '../pageObjects/trading/buyPreviewActions';
import { tradingBuyActions } from '../pageObjects/trading/tradingBuyActions';
import { tradingHistoryActions } from '../pageObjects/trading/tradingHistoryActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';

const preloadedState = preparePreloadedReduxState(
    portfolioTrackerBtcAccountState,
    onboardingCompletedState,
);

describe('Trade Buy [@noDevice]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await onHome.assertIsPortfolioGraphVisible();
        await onTabBar.navigateToTrade();
        await tradingBuyActions.tapTradingSectionHeaderTab();
        await tradingBuyActions.waitForTradeDataToLoad();
    }, 240_000);

    it('Basic buy for 100 PLN flow', async () => {
        await tradingBuyActions.selectReceiveAsset('BTC', undefined, 'Bitcoin');
        await tradingBuyActions.selectBtcFreshAddress('BTC SegWit');
        await tradingBuyActions.selectFiatCurrency('PLN');
        await tradingBuyActions.setFiatAmount('100');
        await tradingBuyActions.selectCountry('Polan', 'Poland', 'POL');

        await tradingBuyActions.viewHowTradingWorks();
        await tradingBuyActions.viewPaymentMethods();
        await tradingBuyActions.viewProviders();
        await tradingBuyActions.expectValidBuyForm();

        await tradingBuyActions.confirmTradingForm();

        await buyPreviewActions.expectBuyPreviewScreenToBeVisible();
        await buyPreviewActions.confirmTrade();
        await tradingBuyActions.expectBrowserAuthTriggered();

        await tradingHistoryActions.openTradeHistory();
        await tradingHistoryActions.openTradeDetail('PLN\xa0100.00');
        await tradingHistoryActions.assertTradeDetail('Buy', 'PLN\xa0100.00', 'BTC SegWit');
    }, 240_000);
});
