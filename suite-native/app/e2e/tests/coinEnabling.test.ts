import { conditionalDescribe } from '@suite-common/test-utils';

import { deviceChecksDisabledState } from '../fixtures/deviceChecksDisabledState';
import { deviceChecksEnabledState } from '../fixtures/deviceChecksEnabledState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceConnecting } from '../pageObjects/deviceConnectingActions';
import { onHome } from '../pageObjects/homeActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import {
    getModelFromEnv,
    openApp,
    preparePreloadedReduxState,
    prepareTrezorEmulator,
} from '../support/setup';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    getModelFromEnv() === 'T3W1' ? deviceChecksDisabledState : deviceChecksEnabledState, // skip device checks on T3W1 because we are using 2-main FW
);

conditionalDescribe(device.getPlatform() === 'android', 'Coin enabling [@fixT3W1]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await prepareTrezorEmulator();
    });

    it('Coin Enabling', async () => {
        await onCoinEnabling.waitForInitScreen();
        await onCoinEnabling.toggleNetwork('btc');
        await onCoinEnabling.clickOnConfirmButton();

        await onDeviceConnecting.waitForDeviceConnectingScreen();
        await onHome.waitForScreen();

        const bitcoinTextElement = element(by.text('Bitcoin'));

        await waitFor(bitcoinTextElement).toExist().withTimeout(10000);

        await onTabBar.navigateToSettings();
        await onSettings.tapCoinEnabling();
        await onCoinEnabling.toggleNetwork('eth');

        await device.pressBack();
        await onTabBar.navigateToHome();

        const ethereumTextElement = element(by.text('Ethereum'));
        await waitFor(ethereumTextElement).toExist().withTimeout(10000);

        await onTabBar.navigateToSettings();
        await onSettings.tapCoinEnabling();
        await onCoinEnabling.toggleNetwork('eth');
        await device.pressBack();
        await onTabBar.navigateToHome();

        await waitFor(ethereumTextElement).not.toExist().withTimeout(10000);
    });
});
