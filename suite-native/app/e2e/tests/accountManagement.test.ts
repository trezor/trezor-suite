import { expect as detoxExpect } from 'detox';

import { xpubs } from '../fixtures/xpubs';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountDetailSettings } from '../pageObjects/accountDetailSettingsActions';
import { onAccountImport } from '../pageObjects/accountImportActions';
import { onHome } from '../pageObjects/homeActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { appIsFullyLoaded, openApp, restartApp } from '../utils';

describe('Account management', () => {
    beforeAll(async () => {
        await openApp({ newInstance: true });
        await onOnboarding.skipOnboarding();
    });

    beforeEach(async () => {
        await restartApp();
        await appIsFullyLoaded();
    });

    it('Import account and rename it', async () => {
        const accountName = 'BTC SegWit';
        const newAccountName = 'Renamed BTC account';

        await onHome.tapSyncCoinsButton();

        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.segwit,
            accountName,
        });

        await onMyAssets.openAccountDetail({ accountName });
        await onAccountDetail.openSettings();

        await onAccountDetailSettings.renameAccount({ newAccountName });

        await detoxExpect(element(by.id('@screen/sub-header/title'))).toHaveText(newAccountName);
    });

    it('Import account and remove it', async () => {
        const accountName = 'BTC Legacy SegWit';

        await onTabBar.navigateToMyAssets();
        await onMyAssets.addAccount();

        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.legacySegwit,
            accountName,
        });

        await onMyAssets.openAccountDetail({ accountName });
        await onAccountDetail.openSettings();
        await onAccountDetailSettings.removeAccount();
        await onTabBar.navigateToMyAssets();

        await detoxExpect(element(by.text(accountName))).not.toExist();
    });
});
