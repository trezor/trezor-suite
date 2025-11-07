import { PROTO } from '@trezor/connect';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onHome } from '../pageObjects/homeActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';

const preloadedState = preparePreloadedReduxState(
    portfolioTrackerBtcAccountState,
    onboardingCompletedState,
);

describe('App Settings - without device interactions [@noDevice]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await onHome.assertIsPortfolioGraphVisible();
        await onHome.scrollScreenToBottom();
    });

    it('Localization - Currency', async () => {
        await waitFor(element(by.text(/^.*\$.*$/i)))
            .toBeVisible()
            .withTimeout(10000);

        await onTabBar.navigateToSettings();
        await onSettings.tapPreferences();
        await onSettings.changeLocalizationCurrency('czk');
        await onTabBar.tapBackButton();
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
        await onTabBar.tapBackButton();
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
        await onTabBar.tapBackButton();
        await onTabBar.navigateToHome();

        await onHome.assertIsDiscreetModeEnabled();
    });
});
