import { expect as detoxExpect } from 'detox';

import { inputTextToElement, waitForVisible } from '../../support/utils';

type CountrySelection = {
    searchValue: string;
    countryName: string;
    countryCodeAlpha3: string;
};

class TradingResidenceActions {
    private readonly countryPicker = element(by.id('@trading-residence/country'));
    private readonly countryValue = element(by.id('@trading-residence/country/value'));

    private readonly subdivisionPicker = element(by.id('@trading-residence/country-subdivision'));
    private readonly subdivisionValue = element(
        by.id('@trading-residence/country-subdivision/value'),
    );

    private readonly countrySearchInput = element(by.id('@trading-residence/country/search-input'));
    private readonly subdivisionSearchInput = element(
        by.id('@trading-residence/country-subdivision/search-input'),
    );

    private readonly confirmOnboardingButton = element(by.id('@onboarding/confirmLocation'));
    private readonly skipOnboardingButton = element(by.id('@onboarding/skipLocation'));
    private readonly confirmSettingsButton = element(by.id('@settings/confirmLocation'));

    async expectOnboardingScreenVisible() {
        await waitForVisible(by.id('@screen/TradingLocation'));
        await detoxExpect(element(by.id('@onboarding/confirmLocation'))).toBeVisible();
        await detoxExpect(element(by.id('@onboarding/skipLocation'))).toBeVisible();
    }

    async selectCountry({ searchValue, countryName, countryCodeAlpha3 }: CountrySelection) {
        await waitForVisible(this.countryPicker);
        await this.countryPicker.tap();

        await waitForVisible(by.id('@trading-residence/country/bottom-sheet'));
        await waitForVisible(this.countrySearchInput);
        await inputTextToElement(this.countrySearchInput, searchValue);

        const countryListItem = element(by.text(countryName));
        await waitForVisible(countryListItem);
        await countryListItem.tap();

        await detoxExpect(this.countryValue).toHaveText(countryCodeAlpha3);
    }

    async selectSubdivision({
        subdivisionName,
        searchValue,
    }: {
        subdivisionName: string;
        searchValue: string;
    }) {
        await waitForVisible(this.subdivisionPicker);
        await this.subdivisionPicker.tap();

        await waitForVisible(by.id('@trading-residence/country-subdivision/bottom-sheet'));
        await waitForVisible(this.subdivisionSearchInput);
        await inputTextToElement(this.subdivisionSearchInput, searchValue);

        const countrySubdivisionListItem = element(by.text(subdivisionName));
        await waitForVisible(countrySubdivisionListItem);
        await countrySubdivisionListItem.tap();

        await detoxExpect(this.subdivisionValue).toHaveText(subdivisionName);
    }

    async skipOnboardingCountrySelection() {
        await waitForVisible(this.skipOnboardingButton);
        await this.skipOnboardingButton.tap();
    }

    async confirmSettingsCountrySelection() {
        await waitForVisible(this.confirmSettingsButton);
        await this.confirmSettingsButton.tap();
    }

    async confirmOnboardingCountrySelection() {
        await waitForVisible(this.confirmOnboardingButton);
        await this.confirmOnboardingButton.tap();
    }
}

export const onTradingResidence = new TradingResidenceActions();
