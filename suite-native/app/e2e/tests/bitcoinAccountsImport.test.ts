import { initialDeviceDataState } from '../fixtures/initialDeviceDataState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';

const preloadedState = preparePreloadedReduxState(initialDeviceDataState, onboardingCompletedState);

describe('Import Bitcoin network accounts. [@noDevice]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await onTabBar.navigateToMyAssets();
        await onMyAssets.addAccount();
    });

    it('Import BTC SegWit account', async () => {
        await onAccountImport.importAccountAndVerifyVisibility({
            networkSymbol: 'btc',
            xpub: xpubs.btc.segwit,
            accountName: 'BTC SegWit',
        });
    });

    it('Import BTC Legacy SegWit account', async () => {
        await onAccountImport.importAccountAndVerifyVisibility({
            networkSymbol: 'btc',
            xpub: xpubs.btc.legacySegwit,
            accountName: 'BTC Legacy SegWit',
        });
    });

    //  This test is skipped for iOS, because detox runner is unable to input single quote (') correctly and inputs quotation mark (’) instead.
    //  Since the quotation mark is invalid character in terms of taproot xpub, the test always fails on iOS.
    if (device.getPlatform() !== 'ios')
        it('Import BTC Taproot account', async () => {
            await onAccountImport.importAccountAndVerifyVisibility({
                networkSymbol: 'btc',
                xpub: xpubs.btc.taproot,
                accountName: 'BTC Taproot',
            });
        });

    it('Import BTC Legacy account', async () => {
        await onAccountImport.importAccountAndVerifyVisibility({
            networkSymbol: 'btc',
            xpub: xpubs.btc.legacy,
            accountName: 'BTC Legacy',
        });
    });
});
