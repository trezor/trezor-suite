import { FiatCurrencyCode } from '@suite-common/suite-config';
import { PROTO } from '@trezor/connect';

import { TREZOR_E2E_DEVICE_LABEL, scrollUntilVisible } from '../utils';
import { onAlertSheet } from './alertSheetActions';

class SettingsActions {
    async tapLocalization() {
        const localizationElement = element(by.id('@settings/localization'));

        await waitFor(localizationElement).toBeVisible().withTimeout(10000);
        await localizationElement.tap();
    }

    async tapPrivacyAndSecurity() {
        const privacyAndSecurityElement = element(by.id('@settings/privacy-and-security'));

        await waitFor(privacyAndSecurityElement).toBeVisible().withTimeout(10000);
        await privacyAndSecurityElement.tap();
    }

    async tapCoinEnabling() {
        const coinEnablingElement = element(by.id('@settings/coin-enabling'));

        await waitFor(coinEnablingElement).toBeVisible().withTimeout(10000);
        await coinEnablingElement.tap();
    }

    async tapViewOnly() {
        const viewOnlyElement = element(by.id('@settings/view-only'));

        await waitFor(viewOnlyElement).toBeVisible().withTimeout(10000);
        await viewOnlyElement.tap();
    }

    async toggleDiscreetMode() {
        const discreetModeToggleElement = element(
            by.id('@settings/privacy-and-security/discreet-mode-toggle'),
        );
        await waitFor(discreetModeToggleElement).toBeVisible().withTimeout(10000);
        await discreetModeToggleElement.tap();
    }

    async changeLocalizationCurrency(currencyCode: FiatCurrencyCode) {
        const currencySelectorTriggerElement = element(
            by.id('@settings/localization/currency-selector'),
        );
        await waitFor(currencySelectorTriggerElement).toBeVisible().withTimeout(10000);
        await currencySelectorTriggerElement.tap();

        const currencySelectorItemElement = element(by.id(`@select/item/${currencyCode}`));
        await scrollUntilVisible(currencySelectorItemElement, '@bottom-sheet/scroll-view');
        await currencySelectorItemElement.tap();
    }

    async changeBitcoinUnits(unit: PROTO.AmountUnit) {
        const currencySelectorTriggerElement = element(
            by.id('@settings/localization/bitcoin-units-selector'),
        );
        await waitFor(currencySelectorTriggerElement).toBeVisible().withTimeout(10000);
        await currencySelectorTriggerElement.tap();

        const currencySelectorItemElement = element(by.id(`@select/item/${unit}`));
        await scrollUntilVisible(currencySelectorItemElement, '@bottom-sheet/scroll-view');
        await currencySelectorItemElement.tap();
    }

    async toggleWalletViewOnly(
        deviceName: string = TREZOR_E2E_DEVICE_LABEL,
        walletIndex: number = 1,
    ) {
        const toggleButtonElement = element(
            by.id(`@settings/view-only/toggle-button/${deviceName}/${walletIndex}`),
        );
        await waitFor(toggleButtonElement).toBeVisible().withTimeout(10000);
        await toggleButtonElement.tap();

        try {
            await onAlertSheet.tapPrimaryButton();
        } catch {
            // Do nothing. In case of enabling view only mode, there is no alert sheet.
        }
    }
}

export const onSettings = new SettingsActions();
