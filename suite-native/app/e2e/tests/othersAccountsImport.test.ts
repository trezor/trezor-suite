import { openApp } from '../utils';
import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onTabBar } from '../pageObjects/tabBarActions';

describe('Import accounts of other networks.', () => {
    beforeAll(async () => {
        await openApp({ newInstance: true });
        await onOnboarding.finishOnboarding();
        await onTabBar.navigateToMyAssets();
    });

    beforeEach(async () => {
        await onMyAssets.addAccount();
    });

    it('Import LTC account', async () => {
        await onAccountImport.importAccount({
            networkSymbol: 'ltc',
            xpub: xpubs.ltc,
            accountName: 'Litecoin SegWit',
        });
    });

    it('Import ZCash account', async () => {
        await onAccountImport.importAccount({
            networkSymbol: 'zec',
            xpub: xpubs.zec,
            accountName: 'Zcash #1',
        });
    });

    it('Import DOGE account', async () => {
        await onAccountImport.importAccount({
            networkSymbol: 'doge',
            xpub: xpubs.doge,
            accountName: 'Dogecoin #1',
        });
    });

    it('Import Cardano account', async () => {
        await onAccountImport.importAccount({
            networkSymbol: 'ada',
            xpub: xpubs.ada,
            accountName: 'Cardano #1',
        });
    });
    it('Import XRP account', async () => {
        await onAccountImport.importAccount({
            networkSymbol: 'xrp',
            xpub: xpubs.xrp,
            accountName: 'Ripple #1',
        });
    });

    it('Import ETH account', async () => {
        await onAccountImport.importAccount({
            networkSymbol: 'eth',
            xpub: xpubs.eth,
            accountName: 'Ethereum #1',
        });
    });
});
