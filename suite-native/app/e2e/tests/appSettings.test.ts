import { expect as detoxExpect } from 'detox';

import CS_TRANSLATIONS from '@suite-native/intl/translations/cs-CZ.json';
import EN_TRANSLATIONS from '@suite-native/intl/translations/en-US.json';
import { PROTO } from '@trezor/connect';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onHome } from '../pageObjects/homeActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';
import { waitForVisible } from '../support/utils';

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
        const fiatInUSDRegex = /^.*\$.*$/i;
        await waitForVisible(by.text(fiatInUSDRegex));
        await onTabBar.navigateToSettings();
        await onSettings.openSection('preferences');
        await onSettings.changeLocalizationCurrency('czk');
        await onTabBar.tapBackButton();
        await onTabBar.navigateToHome();

        await detoxExpect(element(by.text(/^.*CZK.*$/i))).toBeVisible();
    });

    it('Localization - Bitcoin Units', async () => {
        await detoxExpect(element(by.text('0 BTC'))).toBeVisible();
        await onTabBar.navigateToSettings();
        await onSettings.openSection('preferences');
        await onSettings.changeBitcoinUnits(PROTO.AmountUnit.SATOSHI);
        await onTabBar.tapBackButton();
        await onTabBar.navigateToHome();

        await detoxExpect(element(by.text('0 sat'))).toBeVisible();
    });

    it('Localization - Language', async () => {
        await onTabBar.assertHomeTabBarItemTitle(EN_TRANSLATIONS['navigation.tabs.home']);
        await onTabBar.navigateToSettings();
        await onSettings.openSection('preferences');
        await onSettings.changeLanguage('cs-CZ');
        await onTabBar.tapBackButton();
        await onTabBar.navigateToHome();

        await onTabBar.assertHomeTabBarItemTitle(CS_TRANSLATIONS['navigation.tabs.home']);
    });

    it('Privacy & Security - Discreet Mode', async () => {
        await onHome.assertIsDiscreetModeDisabled();

        await onTabBar.navigateToSettings();
        await onSettings.openSection('privacy');
        await onSettings.toggleDiscreetMode();
        await onTabBar.tapBackButton();
        await onTabBar.navigateToHome();

        await onHome.assertIsDiscreetModeEnabled();
    });
});
