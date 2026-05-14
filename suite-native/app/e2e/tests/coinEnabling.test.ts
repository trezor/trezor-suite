import { expect as detoxExpect } from 'detox';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceConnecting } from '../pageObjects/deviceConnectingActions';
import { onHome } from '../pageObjects/homeActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { waitForVisible } from '../support/utils';

const preloadedState = preparePreloadedReduxState(onboardingCompletedState);

describe('Coin enabling [@androidOnly @T3T1 @T3W1]', () => {
    beforeEach(async () => {
        await prepareTrezorEmulator();
        await openApp({ args: { preloadedState } });
    });

    it('Coin Enabling', async () => {
        await onHome.waitForScreen();
        await onHome.tapGetStartedButton();

        await onCoinEnabling.waitForInitScreen();
        await onCoinEnabling.toggleNetwork('btc');
        await onCoinEnabling.clickOnConfirmButton();

        await onDeviceConnecting.waitForDeviceConnectingScreen();
        await onHome.waitForScreen();
        await onHome.scrollScreenToBottom();
        await waitForVisible(by.text('Bitcoin'));

        await onTabBar.navigateToSettings();
        await onSettings.openSection('coin-enabling');
        await onCoinEnabling.toggleNetwork('eth');

        await device.pressBack();
        await onTabBar.navigateToHome();

        await onHome.scrollScreenToBottom();
        await waitForVisible(by.text('Ethereum'));

        await onTabBar.navigateToSettings();
        await onSettings.openSection('coin-enabling');
        await onCoinEnabling.toggleNetwork('eth');
        await device.pressBack();
        await onTabBar.navigateToHome();

        await detoxExpect(element(by.text('Ethereum'))).not.toExist();
    });
});
