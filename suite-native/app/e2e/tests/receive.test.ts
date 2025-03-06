import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountReceive } from '../pageObjects/accountReceiveActions';
import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onHome } from '../pageObjects/homeActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { disconnectTrezorUserEnv, openApp, prepareTrezorEmulator } from '../utils';

conditionalDescribe(device.getPlatform() === 'android', 'Receive', () => {
    it('Generate device confirmed receive address.', async () => {
        await prepareTrezorEmulator();
        await openApp({ newInstance: true });
        await onOnboarding.skipOnboarding();

        await onCoinEnabling.waitForInitScreen();
        await onCoinEnabling.toggleNetwork('btc');
        await onCoinEnabling.clickOnConfirmButton();
        await onAlertSheet.skipViewOnlyMode();

        await onHome.waitForScreen();
        await onTabBar.navigateToMyAssets();

        await onMyAssets.openAccountDetail({ accountName: 'Bitcoin #1' });

        await onAccountDetail.openReceive();
        await onAccountReceive.waitForScreen();

        await onAccountReceive.tapShowAddressButton();
        await TrezorUserEnvLink.pressYes();
        await onAccountReceive.verifyReceiveAddress('bc1qa55m6kz3crfse5xg2rukulyap4eyp75w0puawz');

        disconnectTrezorUserEnv();
    });
});
