import { SupportedLocaleCode } from '@suite-native/intl';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onTabBar } from './tabBarActions';
import { scrollUntilVisible, wait, waitForVisible } from '../support/utils';

const DEV_EVOLU_URL = 'https://suite-sync-dev.suite.sldev.cz/evolu/';

type SettingsOptions =
    | 'preferences'
    | 'suite-sync'
    | 'dev-utils'
    | 'privacy'
    | 'coin-enabling'
    | 'eject-wallets'
    | 'support'
    | 'trading'
    | 'wallet-connect'
    | 'connect-permissions'
    | 'advanced';

class SettingsActions {
    async openSection(option: SettingsOptions) {
        await element(by.id('@screen/mainScrollView')).scrollTo('top');
        const optionElement = element(by.id(`@settings/${option}`));
        await scrollUntilVisible(optionElement);
        await optionElement.tap();
    }

    async toggleDiscreetMode() {
        const discreetModeToggleElement = element(
            by.id('@settings/privacy-and-security/discreet-mode-toggle'),
        );
        await waitForVisible(discreetModeToggleElement);
        await discreetModeToggleElement.tap();
    }

    async changeLanguage(localeTag: SupportedLocaleCode) {
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

    async enableSuiteSync(url = DEV_EVOLU_URL) {
        await this.openSection('dev-utils');
        const saveSuiteSyncUrl = element(by.id('@suiteSync/custom-relay-url-save-button'));
        await scrollUntilVisible(saveSuiteSyncUrl);
        await element(by.id('@suiteSync/custom-relay-url-input')).typeText(url);
        // Workaround close keyboard by clicking on section header
        await element(by.id('@suiteSync/header')).tap();
        await element(by.id('@suiteSync/custom-relay-url-save-button')).tap();
        await onTabBar.tapBackButton();

        await this.openSection('advanced');
        const experimentalFeaturesToggleElement = element(
            by.id('@settings/experimental-features/toggle-switch'),
        );
        await scrollUntilVisible(experimentalFeaturesToggleElement);
        await experimentalFeaturesToggleElement.tap();

        const suiteSyncCheckboxElement = element(
            by.id('@settings/experimental-features/suite-sync/checkbox'),
        );
        await scrollUntilVisible(suiteSyncCheckboxElement);
        await suiteSyncCheckboxElement.tap();
        await onTabBar.tapBackButton();

        await this.openSection('suite-sync');
        await element(by.id('settings/suite-sync-touchable-row')).tap();
        await TrezorUserEnvLink.pressYes();
    }
}

export const onSettings = new SettingsActions();
