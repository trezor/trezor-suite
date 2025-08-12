import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';

import { TREZOR_E2E_DEVICE_LABEL, scrollUntilVisible } from '../utils';

class SettingsActions {
    async tapPreferences() {
        const preferencesSettingsElement = element(by.id('@settings/preferences'));
        await waitFor(preferencesSettingsElement).toBeVisible().withTimeout(10000);
        await preferencesSettingsElement.tap();
    }

    async tapPrivacyAndSecurity() {
        const privacyAndSecurityElement = element(by.id('@settings/privacy'));

        await waitFor(privacyAndSecurityElement).toBeVisible().withTimeout(10000);
        await privacyAndSecurityElement.tap();
    }

    async tapCoinEnabling() {
        const coinEnablingElement = element(by.id('@settings/coin-enabling'));
        await scrollUntilVisible(coinEnablingElement);
        await coinEnablingElement.tap();
    }

    async tapEjectWallets() {
        const ejectWalletsElement = element(by.id('@settings/eject-wallets'));

        await waitFor(ejectWalletsElement).toBeVisible().withTimeout(10000);
        await ejectWalletsElement.tap();
    }

    async toggleDiscreetMode() {
        const discreetModeToggleElement = element(
            by.id('@settings/privacy-and-security/discreet-mode-toggle'),
        );
        await waitFor(discreetModeToggleElement).toBeVisible().withTimeout(10000);
        await discreetModeToggleElement.tap();
    }

    async changeLocalizationCurrency(currencyCode: BaseCurrencyCode) {
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

    async toggleAutoEject() {
        const autoEjectElement = element(by.id('@settings/auto-eject-toggle'));
        await waitFor(autoEjectElement).toBeVisible().withTimeout(10000);
        await autoEjectElement.tap();
    }

    async ejectSingleWallet(deviceName: string = TREZOR_E2E_DEVICE_LABEL, walletIndex: number = 1) {
        const ejectWalletElement = element(
            by.id(`@settings/eject-single-wallet/${deviceName}/${walletIndex}`),
        );
        await waitFor(ejectWalletElement).toBeVisible().withTimeout(10000);
        await ejectWalletElement.tap();
    }
}

export const onSettings = new SettingsActions();
