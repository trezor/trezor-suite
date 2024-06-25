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
import { onReceiveScreen } from '../pageObjects/receiveActions';

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
        const accountName = 'BTC Taproot';

        await onTabBar.navigateToMyAssets();
        await onMyAssets.addAccount();

        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.taproot,
            accountName,
        });

        await onMyAssets.openAccountDetail({ accountName });
        await onAccountDetail.openSettings();
        await onAccountDetailSettings.removeAccount();
        await onTabBar.navigateToMyAssets();

        await detoxExpect(element(by.text(accountName))).not.toExist();
    });

    /**
     * 1. Import BTC SegWit account
     * 2. Navigate to receive screen
     * 3. Show address
     * 4. Copy address
     * 5. Check if address is copied to clipboard by verifying the toast message
     */
    it.only('Generate btc address and copy it to clipboard', async () => {
        const accountName = 'BTC SegWit';
        await onHome.tapSyncCoinsButton();
        await onAccountImport.importAccount({
            networkSymbol: 'btc',
            xpub: xpubs.btc.segwit,
            accountName,
        });

        await onTabBar.navigateToReceive();
        await onMyAssets.openAccountDetail({ accountName, accDetail: 'receive' });
        await onReceiveScreen.showAddress();
        await onReceiveScreen.copyAddress();
    });
});
