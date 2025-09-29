import { conditionalDescribe } from '@suite-common/test-utils';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceConnecting } from '../pageObjects/deviceConnectingActions';
import { onHome } from '../pageObjects/homeActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import {
    disconnectTrezorUserEnv,
    openApp,
    preparePreloadedReduxState,
    prepareTrezorEmulator,
} from '../utils';

conditionalDescribe(device.getPlatform() === 'android', 'Coin enabling', () => {
    beforeAll(async () => {
        await prepareTrezorEmulator();
        await openApp({
            newInstance: true,
            args: {
                preloadedState: preparePreloadedReduxState(onboardingCompletedState),
            },
        });
    });

    afterAll(async () => {
        await disconnectTrezorUserEnv();
        await device.terminateApp();
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
