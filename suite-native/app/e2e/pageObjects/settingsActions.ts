import { SupportedLocaleCode } from '@suite-native/intl';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onTabBar } from './tabBarActions';
import { scrollUntilVisible, wait, waitForVisible } from '../support/utils';

// On Android emulator, the host machine is reachable at 10.0.2.2, an alias for localhost.
const LOCAL_RELAY_URL = 'http://10.0.2.2:4000';
const LOCAL_QUOTA_URL = 'http://10.0.2.2:4001';

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
        await scrollUntilVisible(languageSelectorItemElement, {
            scrollViewTestId: '@bottom-sheet/scroll-view',
        });

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
        await scrollUntilVisible(currencySelectorItemElement, {
            scrollViewTestId: '@bottom-sheet/scroll-view',
        });

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
        await scrollUntilVisible(currencySelectorItemElement, {
            scrollViewTestId: '@bottom-sheet/scroll-view',
        });
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

    async enableSuiteSync(url = LOCAL_RELAY_URL, quotaUrl = LOCAL_QUOTA_URL) {
        await this.openSection('dev-utils');
        const saveSuiteSyncUrl = element(by.id('@suiteSync/custom-relay-url-save-button'));
        await scrollUntilVisible(saveSuiteSyncUrl);
        await element(by.id('@suiteSync/custom-relay-url-input')).replaceText(url);
        // Workaround: close keyboard by clicking on section header before tapping Save
        await element(by.id('@suiteSync/header')).tap();
        await element(by.id('@suiteSync/custom-relay-url-save-button')).tap();

        const enforceQuotaManagerSwitcher = element(by.id('@suiteSyncQuotaManager/save-button'));
        await scrollUntilVisible(enforceQuotaManagerSwitcher);
        await element(by.id('@suiteSyncQuotaManager/url-input')).replaceText(quotaUrl);
        await enforceQuotaManagerSwitcher.tap();

        const enforceQuotaManager = element(by.id('@suiteSyncQuotaManager/enforce-switch'));
        await scrollUntilVisible(enforceQuotaManager);
        await enforceQuotaManager.tap();

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
        await wait(1000);
        await element(by.id('settings/suite-sync-touchable-row')).tap();
        await wait(1000);
        await waitForVisible(by.id('@continue-on-trezor'));
        await TrezorUserEnvLink.pressYes();
        await waitForVisible(by.id('settings/suite-sync-touchable-row'));
    }
}

export const onSettings = new SettingsActions();
