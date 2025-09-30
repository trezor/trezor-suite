import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onHome } from '../pageObjects/homeActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { tradingBuyActions } from '../pageObjects/tradingBuyActions';
import { tradingHistoryActions } from '../pageObjects/tradingHistoryActions';
import { openApp, preparePreloadedReduxState } from '../utils';

const preloadedState = preparePreloadedReduxState(
    portfolioTrackerBtcAccountState,
    onboardingCompletedState,
);

describe('Trade Buy', () => {
    beforeAll(async () => {
        await openApp({
            newInstance: true,
            args: {
                preloadedState,
            },
        });
        await onHome.assertIsPortfolioGraphVisible();
        await onTabBar.navigateToTrade();
        await tradingBuyActions.waitForTradeDataToLoad();
    });

    afterAll(async () => {
        await device.terminateApp();
    });

    it('Basic buy for 100 PLN flow', async () => {
        await tradingBuyActions.selectAsset('BTC');
        await tradingBuyActions.selectBtcReceiveAccount('BTC SegWit', "m/84'/0'/0'/0/0");
        await tradingBuyActions.selectFiatCurrency('PLN');
        await tradingBuyActions.selectCountry('Polan', '🇵🇱 Poland');
        await tradingBuyActions.setFiatAmount('100');

        await tradingBuyActions.scrollScreenToBottom();
        await tradingBuyActions.viewPaymentMethods();
        await tradingBuyActions.viewProviders();

        await tradingBuyActions.expectValidBuyForm();
        await tradingBuyActions.confirmBuyForm();
        await tradingBuyActions.closePaymentWebview();

        await tradingHistoryActions.openTradeHistory();
        await tradingHistoryActions.openTradeDetail('PLN\xa0100.00');
        await tradingHistoryActions.assertTradeDetail('Buy', 'PLN\xa0100.00', 'BTC SegWit');
    });
});
