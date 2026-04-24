import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onHome } from '../pageObjects/homeActions';
import { onTabBar } from '../pageObjects/tabBarActions';
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
        await tradingBuyActions.waitForTradeDataToLoad();
    }, 240_000);

    it('Basic buy for 100 PLN flow', async () => {
        await tradingBuyActions.selectReceiveAsset('BTC');
        await tradingBuyActions.selectBtcReceiveAccount('BTC SegWit', "m/84'/0'/0'/0/0");
        await tradingBuyActions.selectFiatCurrency('PLN');
        await tradingBuyActions.selectCountry('Polan', 'Poland', 'POL');
        await tradingBuyActions.setFiatAmount('100');

        await tradingBuyActions.scrollToLearnMoreLink();
        await tradingBuyActions.viewPaymentMethods();
        await tradingBuyActions.viewProviders();
        await tradingBuyActions.expectValidBuyForm();

        await tradingBuyActions.confirmTradingForm();
        await tradingBuyActions.expectBrowserAuthTriggered();

        await tradingHistoryActions.openTradeHistory();
        await tradingHistoryActions.openTradeDetail('PLN\xa0100.00');
        await tradingHistoryActions.assertTradeDetail('Buy', 'PLN\xa0100.00', 'BTC SegWit');
    }, 240_000);
});
