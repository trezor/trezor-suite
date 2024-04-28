import { expect as detoxExpect } from 'detox';

import { onOnboarding } from '../pageObjects/onboardingActions';
import { xpubs } from '../fixtures/xpubs';
import { appIsFullyLoaded, openApp, restartApp } from '../utils';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';

describe('Import invalid accounts', () => {
    beforeAll(async () => {
        await openApp({ newInstance: true });
        await onOnboarding.finishOnboarding();
    });

    beforeEach(async () => {
        await restartApp();
        await appIsFullyLoaded();
    });
    it('Import an already imported XPUB', async () => {
        // add first account
        await onTabBar.navigateToMyAssets();
        await onMyAssets.addAccount();
        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.legacySegwit,
            accountName: 'BTC Legacy SegWit',
        });

        // try to add account with same xpub
        await onTabBar.navigateToMyAssets();
        await onMyAssets.addAccount();
        await onAccountImport.selectCoin({ networkSymbol: 'btc' });
        await onAccountImport.submitXpub({ xpub: xpubs.btc.legacySegwit, isValid: true });

        await detoxExpect(element(by.id('@account-import/summary/account-already-imported')));
    });

    it('Import BTC receive address', async () => {
        const btcReceiveAddress = 'bc1qunyzxr3gfcg7ggxp5vpxwm3q7t3xc52rcaupu4';

        await onTabBar.navigateToMyAssets();
        await onMyAssets.addAccount();
        await onAccountImport.selectCoin({ networkSymbol: 'btc' });
        await onAccountImport.submitXpub({ xpub: btcReceiveAddress, isValid: false });

        await detoxExpect(element(by.id('@alert-sheet/error/invalidXpub')));
    });
});
