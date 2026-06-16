import { expect as detoxExpect } from 'detox';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';

const goToBtcImportXpubScreen = async () => {
    await onTabBar.navigateToMyAssets();
    await onMyAssets.addAccount();
    await onAccountImport.selectCoin({ networkSymbol: 'btc' });
};

const preloadedState = preparePreloadedReduxState(onboardingCompletedState);

// Skipping due to emulator crash
describe.skip('Import invalid accounts [@noDevice]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await goToBtcImportXpubScreen();
    });

    it('Import an already imported XPUB', async () => {
        // add first account
        await onAccountImport.importAccountAndVerifyVisibility({
            networkSymbol: 'btc',
            xpub: xpubs.btc.legacySegwit,
            accountName: 'BTC Legacy SegWit',
        });

        // try to add account with same xpub
        await goToBtcImportXpubScreen();
        await onAccountImport.submitXpub({ xpub: xpubs.btc.legacySegwit, isValid: true });

        await detoxExpect(
            element(by.id('@account-import/summary/account-already-imported')),
        ).toBeVisible();
    });

    it('Import BTC receive address', async () => {
        const btcReceiveAddress = 'bc1qunyzxr3gfcg7ggxp5vpxwm3q7t3xc52rcaupu4';

        await onAccountImport.selectCoin({ networkSymbol: 'btc' });
        await onAccountImport.submitXpub({ xpub: btcReceiveAddress, isValid: false });

        await detoxExpect(element(by.text('This is your receive address'))).toBeVisible();
    });
});
