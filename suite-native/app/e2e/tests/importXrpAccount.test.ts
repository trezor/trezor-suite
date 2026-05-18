import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';

const preloadedState = preparePreloadedReduxState(onboardingCompletedState);

describe('Import XRP account. [@noDevice]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await onTabBar.navigateToMyAssets();
        await onMyAssets.addAccount();
    });

    it('Import XRP account', async () => {
        await onAccountImport.importAccountAndVerifyVisibility({
            networkSymbol: 'xrp',
            xpub: xpubs.xrp,
            accountName: 'Ripple #1',
        });
    });
});
