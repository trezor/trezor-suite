import { expect as detoxExpect } from 'detox';

import { conditionalDescribe } from '@suite-common/test-utils';

import { onboardingCompleted } from '../fixtures/onboardingCompleted';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { disconnectTrezorUserEnv, openApp, prepareTrezorEmulator } from '../utils';

conditionalDescribe(device.getPlatform() === 'android', 'Coin enabling', () => {
    beforeAll(async () => {
        await prepareTrezorEmulator();
        await openApp({ newInstance: true, args: { preloadedState: onboardingCompleted } });
    });

    afterAll(async () => {
        await disconnectTrezorUserEnv();
        await device.terminateApp();
    });

    it('Coin Enabling', async () => {
        await onCoinEnabling.waitForInitScreen();
        await onCoinEnabling.toggleNetwork('btc');
        await onCoinEnabling.clickOnConfirmButton();
        await detoxExpect(element(by.id('@home/portfolio/header'))).toExist();

        await onTabBar.navigateToSettings();
        await onSettings.tapCoinEnabling();
        await onCoinEnabling.toggleNetwork('eth');

        await device.pressBack();
        await device.pressBack();

        const ethereumTextElement = element(by.text('Ethereum'));

        await detoxExpect(ethereumTextElement).toExist();

        await onTabBar.navigateToSettings();
        await onSettings.tapCoinEnabling();
        await onCoinEnabling.toggleNetwork('eth');
        await device.pressBack();
        await device.pressBack();

        await detoxExpect(ethereumTextElement).not.toExist();
    });
});
