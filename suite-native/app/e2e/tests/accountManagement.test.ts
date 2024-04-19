import { expect as detoxExpect } from 'detox';

import { appIsFullyLoaded, openApp, restartApp } from '../utils';
import { xpubs } from '../fixtures/xpubs';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onHome } from '../pageObjects/homeActions';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountDetailSettings } from '../pageObjects/accountDetailSettingsActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';

describe('Account management', () => {
    beforeAll(async () => {
        await openApp({ newInstance: true });
        await onOnboarding.finishOnboarding();
    });
    beforeEach(async () => {
        await restartApp();
        await appIsFullyLoaded();
    });

    it('Import account and rename it', async () => {
        await onHome.tapSyncCoinsButton();

        const accountName = 'BTC SegWit';
        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.segwit,
            accountName,
        });

        await onMyAssets.openAccountDetail({ accountName });
        await onAccountDetail.tapSettingsButton();

        const newAccountName = 'Renamed BTC account';
        await onAccountDetailSettings.renameAccount({ newAccountName });

        await detoxExpect(element(by.id('@screen/sub-header/title'))).toHaveText(newAccountName);
    });

    it('Import account and remove it', async () => {
        await onTabBar.navigateToMyAssets();
        await onMyAssets.tapAddAccountButton();

        const accountName = 'BTC Taproot';
        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.taproot,
            accountName,
        });

        await onMyAssets.openAccountDetail({ accountName });
        await onAccountDetail.tapSettingsButton();
        await onAccountDetailSettings.removeAccount();
        await onTabBar.navigateToMyAssets();

        await detoxExpect(element(by.text(accountName))).not.toExist();
    });
});
