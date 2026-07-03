import { onOnboarding } from '../pageObjects/onboardingActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { onTradingResidence } from '../pageObjects/trading/tradingResidenceActions';
import { openApp } from '../support/setup';

describe('Country selection onboarding [@noDevice @iosOnly]', () => {
    beforeEach(async () => {
        await openApp({ args: { isTradingResidenceCheckEnabled: true } });
        await onOnboarding.finishOnboarding();
        await onTradingResidence.expectOnboardingScreenVisible();
    });

    it('Selects country during onboarding on a fresh app', async () => {
        await onTradingResidence.selectCountry({
            searchValue: 'USA',
            countryName: 'United States of America',
            countryCodeAlpha3: 'USA',
        });

        await onTradingResidence.selectSubdivision({
            subdivisionName: 'California',
            searchValue: 'Calif',
        });

        await onTradingResidence.confirmOnboardingCountrySelection();

        await onTabBar.navigateToTrade();
    });

    it('Sets residence in Settings after skipping onboarding country selection', async () => {
        await onTradingResidence.skipOnboardingCountrySelection();

        await onTabBar.navigateToHome();
        await onTabBar.assertTradingIsNotVisible();
        await onTabBar.navigateToSettings();

        await onSettings.openSection('trading');

        await onTradingResidence.selectCountry({
            searchValue: 'Czech',
            countryName: 'Czechia',
            countryCodeAlpha3: 'CZE',
        });
        await onTradingResidence.confirmSettingsCountrySelection();

        await onTabBar.navigateToTrade();
    });
});
