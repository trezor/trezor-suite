import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';

const preloadedState = preparePreloadedReduxState(onboardingCompletedState);

// Constatntly failing on iOS, TODO issue https://github.com/trezor/trezor-suite/issues/31780
describe.skip('Import altcoin accounts. [@noDevice]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await onTabBar.navigateToMyAssets();
        await onMyAssets.addAccount();
    });

    it('Import LTC account', async () => {
        await onAccountImport.importAccountAndVerifyVisibility({
            networkSymbol: 'ltc',
            xpub: xpubs.ltc,
            accountName: 'Litecoin SegWit',
        });
    });

    it('Import ZCash account', async () => {
        await onAccountImport.importAccountAndVerifyVisibility({
            networkSymbol: 'zec',
            xpub: xpubs.zec,
            accountName: 'Zcash #1',
        });
    });

    it('Import DOGE account', async () => {
        await onAccountImport.importAccountAndVerifyVisibility({
            networkSymbol: 'doge',
            xpub: xpubs.doge,
            accountName: 'Dogecoin #1',
        });
    });

    it('Import Cardano account', async () => {
        await onAccountImport.importAccountAndVerifyVisibility({
            networkSymbol: 'ada',
            xpub: xpubs.ada,
            accountName: 'Cardano #1',
        });
    });

    it('Import XRP account', async () => {
        await onAccountImport.importAccountAndVerifyVisibility({
            networkSymbol: 'xrp',
            xpub: xpubs.xrp,
            accountName: 'Ripple #1',
        });
    });

    it('Import ETH account', async () => {
        await onAccountImport.importAccountAndVerifyVisibility({
            networkSymbol: 'eth',
            xpub: xpubs.eth,
            accountName: 'Ethereum #1',
        });
    });
});
