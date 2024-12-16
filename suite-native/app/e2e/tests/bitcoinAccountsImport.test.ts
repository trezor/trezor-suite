import { openApp } from '../utils';
import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onTabBar } from '../pageObjects/tabBarActions';

describe('Import Bitcoin network accounts.', () => {
    beforeAll(async () => {
        await openApp({ newInstance: true });
        await onOnboarding.finishOnboarding();
        await onTabBar.navigateToMyAssets();
    });

    beforeEach(async () => {
        await onMyAssets.addAccount();
    });

    it('Import BTC SegWit account', async () => {
        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.segwit,
            accountName: 'BTC SegWit',
        });
    });

    it('Import BTC Legacy SegWit account', async () => {
        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.legacySegwit,
            accountName: 'BTC Legacy SegWit',
        });
    });

    //  This test is skipped for iOS, because detox runner is unable to input single quote (') correctly and inputs quotation mark (’) instead.
    //  Since the quotation mark is invalid character in terms of taproot xpub, the test always fails on iOS.
    if (device.getPlatform() !== 'ios')
        it('Import BTC Taproot account', async () => {
            await onAccountImport.importAccount({
                networkSymbol: 'btc',
                xpub: xpubs.btc.taproot,
                accountName: 'BTC Taproot',
            });
        });

    it('Import BTC Legacy account', async () => {
        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.legacy,
            accountName: 'BTC Legacy',
        });
    });
});
