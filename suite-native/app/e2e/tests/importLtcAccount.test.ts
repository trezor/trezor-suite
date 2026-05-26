import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';

const preloadedState = preparePreloadedReduxState(onboardingCompletedState);

// Skipped due to Android emulator crashes
describe.skip('Import LTC account. [@noDevice]', () => {
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
});
