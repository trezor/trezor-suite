import { PROTO } from '@trezor/connect';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onHome } from '../pageObjects/homeActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { appIsFullyLoaded, mergePreloadedReduxState, openApp, restartApp } from '../utils';

const preloadedState = mergePreloadedReduxState(
    portfolioTrackerBtcAccountState,
    onboardingCompletedState,
);

describe('App Settings - without device interactions', () => {
    beforeAll(async () => {
        await openApp({
            newInstance: true,
            args: { preloadedState },
        });
    });

    beforeEach(async () => {
        await restartApp();
        await appIsFullyLoaded();
    });

    afterAll(async () => {
        await device.terminateApp();
    });

    it('Localization - Currency', async () => {
        await waitFor(element(by.text(/^.*\$.*$/i)))
            .toBeVisible()
            .withTimeout(10000);

        await onTabBar.navigateToSettings();
        await onSettings.tapPreferences();
        await onSettings.changeLocalizationCurrency('czk');
        await device.pressBack();
        await onTabBar.navigateToHome();

        await waitFor(element(by.text(/^.*CZK.*$/i)))
            .toBeVisible()
            .withTimeout(10000);
    });

    it('Localization - Bitcoin Units', async () => {
        await waitFor(element(by.text('0 BTC')))
            .toBeVisible()
            .withTimeout(10000);

        await onTabBar.navigateToSettings();
        await onSettings.tapPreferences();
        await onSettings.changeBitcoinUnits(PROTO.AmountUnit.SATOSHI);
        await device.pressBack();
        await onTabBar.navigateToHome();

        await waitFor(element(by.text('0 sat')))
            .toBeVisible()
            .withTimeout(10000);
    });

    it('Privacy & Security - Discreet Mode', async () => {
        await onHome.assertIsDiscreetModeDisabled();

        await onTabBar.navigateToSettings();
        await onSettings.tapPrivacyAndSecurity();
        await onSettings.toggleDiscreetMode();
        await device.pressBack();
        await onTabBar.navigateToHome();

        await onHome.assertIsDiscreetModeEnabled();
    });
});
