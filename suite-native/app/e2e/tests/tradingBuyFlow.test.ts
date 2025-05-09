import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onHome } from '../pageObjects/homeActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { tradingBuyActions } from '../pageObjects/tradingBuyActions';
import { tradingHistoryActions } from '../pageObjects/tradingHistoryActions';
import { appIsFullyLoaded, openApp, restartApp } from '../utils';

describe('Trade Buy', () => {
    beforeAll(async () => {
        await openApp({ newInstance: true });
        await onOnboarding.skipOnboarding();
        await onHome.tapSyncCoinsButton();
        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.segwit,
            accountName: 'BTC SegWit',
        });
    });

    afterAll(async () => {
        await device.terminateApp();
    });

    beforeEach(async () => {
        await restartApp();
        await appIsFullyLoaded();
        await onTabBar.navigateToTrade();
        await tradingBuyActions.waitForTradeDataToLoad();
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
        await tradingHistoryActions.openTradeDetail('100 PLN');
        await tradingHistoryActions.assertTradeDetail('Buy', '100 PLN', 'BTC SegWit');
    });
});
