import { LocaleTag } from '@suite-native/intl';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';

import { scrollUntilVisible, wait, waitForVisible } from '../support/utils';

class SettingsActions {
    async tapPreferences() {
        const preferencesSettingsElement = element(by.id('@settings/preferences'));
        await waitForVisible(preferencesSettingsElement);
        await preferencesSettingsElement.tap();
    }

    async tapPrivacyAndSecurity() {
        const privacyAndSecurityElement = element(by.id('@settings/privacy'));
        await waitForVisible(privacyAndSecurityElement);
        await privacyAndSecurityElement.tap();
    }

    async tapCoinEnabling() {
        const coinEnablingElement = element(by.id('@settings/coin-enabling'));
        await scrollUntilVisible(coinEnablingElement);
        await coinEnablingElement.tap();
    }

    async tapEjectWallets() {
        const ejectWalletsElement = element(by.id('@settings/eject-wallets'));
        await waitForVisible(ejectWalletsElement);
        await ejectWalletsElement.tap();
    }

    async toggleDiscreetMode() {
        const discreetModeToggleElement = element(
            by.id('@settings/privacy-and-security/discreet-mode-toggle'),
        );
        await waitForVisible(discreetModeToggleElement);
        await discreetModeToggleElement.tap();
    }

    async changeLanguage(localeTag: LocaleTag) {
        const languageSelectorTriggerElement = element(
            by.id('@settings/localization/language-selector'),
        );
        await waitForVisible(languageSelectorTriggerElement);
        await languageSelectorTriggerElement.tap();

        await wait(1000); // wait for the language selector to open

        const languageSelectorItemElement = element(by.id(`@select/item/${localeTag}`));
        await scrollUntilVisible(languageSelectorItemElement, '@bottom-sheet/scroll-view');

        await languageSelectorItemElement.tap();
        await wait(1000); // wait for the language selector to close
    }

    async changeLocalizationCurrency(currencyCode: BaseCurrencyCode) {
        const currencySelectorTriggerElement = element(
            by.id('@settings/localization/currency-selector'),
        );
        await waitForVisible(currencySelectorTriggerElement);
        await currencySelectorTriggerElement.tap();

        await wait(1000); // wait for the currency selector to open

        const currencySelectorItemElement = element(by.id(`@select/item/${currencyCode}`));
        await scrollUntilVisible(currencySelectorItemElement, '@bottom-sheet/scroll-view');

        await currencySelectorItemElement.tap();
        await wait(1000); // wait for the currency selector to close
    }

    async changeBitcoinUnits(unit: PROTO.AmountUnit) {
        const currencySelectorTriggerElement = element(
            by.id('@settings/localization/bitcoin-units-selector'),
        );
        await waitForVisible(currencySelectorTriggerElement);
        await currencySelectorTriggerElement.tap();

        const currencySelectorItemElement = element(by.id(`@select/item/${unit}/content`));
        await scrollUntilVisible(currencySelectorItemElement, '@bottom-sheet/scroll-view');
        await currencySelectorItemElement.tap();
        await wait(1000); // wait for the bitcoin units selector to close
    }

    async toggleAutoEject() {
        const autoEjectElement = element(by.id('@settings/auto-eject-toggle'));
        await waitForVisible(autoEjectElement);
        await autoEjectElement.tap();
    }

    async ejectSingleWallet() {
        const ejectWalletElement = element(by.id(`@settings/eject-single-wallet`));
        await waitForVisible(ejectWalletElement);
        await ejectWalletElement.tap();
    }
}

export const onSettings = new SettingsActions();
