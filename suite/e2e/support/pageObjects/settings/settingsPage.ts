import { Locator, Page, test } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { LabelingSelectValue } from '@trezor/suite/src/constants/suite/labeling';
import { capitalizeFirstLetter } from '@trezor/utils';

import { CoinsTab } from './coinsTab';
import { DebugTab } from './debugTab';
import { DeviceTab } from './deviceTab';
import { WalletConnectTab } from './walletConnectTab';
import { step } from '../../common';
import { DeviceFixture } from '../../device';
import { expect } from '../../testExtends/customMatchers';

export enum Theme {
    System = 'system',
    Dark = 'dark',
    Light = 'light',
}

export enum Language {
    Spanish = 'es-ES',
    Czech = 'cs-CZ',
    English = 'en-US',
}

export const languageMap = {
    'es-ES': 'Español',
    'cs-CZ': 'Čeština',
    'en-US': 'English',
};

const backgroundImageButton = {
    original_t2t1: '@modal/gallery/color_240x240/original_t2t1',
    circleweb: '@modal/gallery/bw_64x128/circleweb',
    nyancat: '@modal/gallery/bw_64x128/nyancat',
};

export class SettingsPage {
    private readonly TIMES_CLICK_TO_SET_DEBUG_MODE = 5;
    readonly deviceTab: DeviceTab;
    readonly coinsTab: CoinsTab;
    readonly walletConnectTab: WalletConnectTab;
    readonly debugTab: DebugTab;

    readonly settingsMenuButton: Locator;
    readonly settingsMenu: Locator;
    readonly settingsHeader: Locator;
    readonly debugTabButton: Locator;
    readonly connectTabButton: Locator;
    readonly applicationTabButton: Locator;
    readonly deviceTabButton: Locator;
    readonly coinsTabButton: Locator;
    readonly earlyAccessJoinButton: Locator;
    readonly earlyAccessConfirmCheck: Locator;
    readonly earlyAccessConfirmButton: Locator;
    readonly earlyAccessSkipButton: Locator;
    readonly settingsCloseButton: Locator;
    readonly modal: Locator;
    readonly modalCloseButton: Locator;
    readonly deviceLabelInput: Locator;
    readonly deviceLabelSubmit: Locator;
    readonly confirmOnDevicePrompt: Locator;
    readonly homescreenGalleryButton: Locator;
    readonly notificationSuccessToast: Locator;
    readonly themeInput: Locator;
    readonly themeInputOption = (theme: Theme) =>
        this.page.getByTestId(`@theme/color-scheme-select/option/${theme}`);
    readonly languageInput: Locator;
    readonly languageInputOption = (language: Language) =>
        this.page.getByTestId(`@settings/language-select/option/${language}`);
    readonly checkSeedButton: Locator;
    readonly metadataSelectInput: Locator;
    readonly metadataSelectInputOption = (option: LabelingSelectValue) =>
        this.page.getByTestId(`@settings/labeling-select/option/${option}`);
    readonly analyticsSwitch: Locator;
    readonly analyticsSwitchInput: Locator;
    readonly showLogButton: Locator;
    readonly fiatCurrencyInput: Locator;
    readonly fiatCurrencyInputOption = (currency: BaseCurrencyCode) =>
        this.page.getByTestId(`@settings/fiat-select/option/${currency}`);
    readonly btcUnitsInput: Locator;
    readonly btcUnitsInputOption = (unit: 'Bitcoin' | 'Satoshis') =>
        this.page.getByTestId(`@settings/btc-units-select/option/${unit}`);
    readonly safetyChecksButton: Locator;
    readonly safetyChecksConfirmButton: Locator;
    readonly safetyChecksRadioButton = (level?: 'strict' | 'prompt'): Locator =>
        level === undefined
            ? this.page.locator('[data-testid*="@radio-button"]')
            : this.page.getByTestId(`@radio-button-${level}`);
    readonly safetyChecksRadioButtonCheck = (check: boolean): Locator =>
        this.page.locator(`[data-testid*="@radio-button"][data-checked="${check}"]`);
    readonly settingsLoader: Locator;
    readonly experimentalFeaturesSwitch: Locator;
    readonly suiteSyncCheckbox: Locator;
    readonly resetAppButton: Locator;

    constructor(
        private readonly page: Page,
        private readonly device: DeviceFixture,
    ) {
        this.deviceTab = new DeviceTab(page);
        this.coinsTab = new CoinsTab(page);
        this.walletConnectTab = new WalletConnectTab(page);
        this.debugTab = new DebugTab(page);

        this.settingsMenuButton = this.page.getByTestId('@suite/menu/settings');
        this.settingsMenu = this.page.getByTestId('@settings/menu');
        this.settingsHeader = this.page.getByTestId('@settings/menu/title');
        this.debugTabButton = this.page.getByTestId('@settings/menu/debug');
        this.connectTabButton = this.page.getByTestId('@settings/menu/connected-apps');
        this.applicationTabButton = this.page.getByTestId('@settings/menu/general');
        this.deviceTabButton = this.page.getByTestId('@settings/menu/device');
        this.coinsTabButton = this.page.getByTestId('@settings/menu/wallet');
        this.earlyAccessJoinButton = this.page.getByTestId('@settings/early-access-join-button');
        this.earlyAccessConfirmCheck = this.page.getByTestId(
            '@settings/early-access-confirm-check',
        );
        this.earlyAccessConfirmButton = this.page.getByTestId(
            '@settings/early-access-confirm-button',
        );
        this.earlyAccessSkipButton = this.page.getByTestId('@settings/early-access-skip-button');
        this.settingsCloseButton = this.page.getByTestId('@suite/menu/suite-start');
        this.modal = this.page.modal;
        this.modalCloseButton = this.page.getByTestId('@modal/close-button');
        this.deviceLabelInput = this.page.getByTestId('@settings/device/label-input');
        this.deviceLabelSubmit = this.page.getByTestId('@settings/device/label-submit');
        this.confirmOnDevicePrompt = this.page.getByTestId('@prompts/confirm-on-device');
        this.homescreenGalleryButton = this.page.getByTestId('@settings/device/homescreen-gallery');
        this.notificationSuccessToast = this.page.getByTestId('@toast/settings-applied').first();
        this.themeInput = this.page.getByTestId('@theme/color-scheme-select/input');
        this.languageInput = this.page.getByTestId('@settings/language-select/input');
        this.checkSeedButton = this.page.getByTestId('@settings/device/check-seed-button');
        this.metadataSelectInput = this.page.getByTestId('@settings/labeling-select/input');
        this.analyticsSwitch = this.page.getByTestId('@analytics/toggle-switch');
        this.analyticsSwitchInput = this.page
            .getByTestId('@analytics/toggle-switch')
            .locator('input');
        this.showLogButton = this.page.getByTestId('@settings/show-log-button');
        this.fiatCurrencyInput = this.page.getByTestId('@settings/fiat-select/input');
        this.btcUnitsInput = this.page.getByTestId('@settings/btc-units-select/input');
        this.safetyChecksButton = this.page.getByTestId('@settings/device/safety-checks-button');
        this.safetyChecksConfirmButton = this.page.getByTestId('@safety-checks-apply');
        this.settingsLoader = this.page.getByTestId('@settings/loader');
        this.experimentalFeaturesSwitch = this.page.getByTestId(
            '@settings/experimental-features/toggle-switch',
        );
        this.suiteSyncCheckbox = this.page.getByTestId(
            '@settings/experimental-features/suite-sync-checkbox',
        );
        this.resetAppButton = this.page.getByTestId('@settings/reset-app-button');
    }

    @step()
    async navigateTo(tab: 'application' | 'coins' | 'device' | 'debug' | 'connect') {
        const notInSettings = !(await this.settingsHeader.isVisible());
        if (notInSettings) {
            await this.settingsMenuButton.click();

            await expect(this.settingsHeader).toHaveTranslation('TR_SETTINGS', { timeout: 10000 });
            await expect(this.settingsMenu).toBeVisible();
        }
        const tabNavigation: { [key: string]: () => Promise<void> } = {
            application: () => this.applicationTabButton.click(),
            coins: () => this.coinsTabButton.click(),
            device: () => this.deviceTabButton.click(),
            debug: () => this.debugTabButton.click(),
            connect: () => this.connectTabButton.click(),
        };
        await tabNavigation[tab]();
    }

    @step()
    async toggleDebugModeInSettings() {
        await expect(this.settingsHeader).toBeVisible();
        for (let i = 0; i < this.TIMES_CLICK_TO_SET_DEBUG_MODE; i++) {
            await this.settingsHeader.click();
        }
        await expect(this.debugTabButton).toBeVisible();
    }

    @step()
    async joinEarlyAccessProgram() {
        await this.earlyAccessJoinButton.scrollIntoViewIfNeeded();
        await this.earlyAccessJoinButton.click();
        await expect(this.modal).toBeVisible();
        await this.earlyAccessConfirmCheck.click();
        await this.earlyAccessConfirmButton.click();
        await this.earlyAccessSkipButton.click();
    }

    @step()
    async closeSettings() {
        await this.settingsCloseButton.click();
        await this.settingsHeader.waitFor({ state: 'detached' });
    }

    @step()
    async changeTheme(theme: Theme) {
        await this.page.selectDropdownOptionWithRetry(
            this.themeInput,
            this.themeInputOption(theme),
        );
        await expect(this.themeInput).toHaveText(capitalizeFirstLetter(theme));
    }

    @step()
    async changeLanguage(language: Language) {
        await this.page.selectDropdownOptionWithRetry(
            this.languageInput,
            this.languageInputOption(language),
        );
        await expect(this.languageInput).toHaveText(languageMap[language]);
    }

    @step()
    async changeDeviceName(newDeviceName: string) {
        await this.deviceLabelInput.clear();
        await this.deviceLabelInput.fill(newDeviceName);
        await this.deviceLabelSubmit.click();
        await expect(this.confirmOnDevicePrompt).toBeVisible();
        await this.device.pressYes();
        await this.confirmOnDevicePrompt.waitFor({ state: 'detached' });
        await expect(this.notificationSuccessToast).toBeVisible();
    }

    @step()
    async changeDeviceBackground(image: keyof typeof backgroundImageButton) {
        await test.step('Change display background image', async () => {
            await this.homescreenGalleryButton.click();
            const imageButton = this.page.getByTestId(backgroundImageButton[image]);
            await expect(imageButton).toHaveLoadedImage();
            await imageButton.click();
            await expect(this.confirmOnDevicePrompt).toBeVisible();
            await this.device.pressYes();
            await this.confirmOnDevicePrompt.waitFor({ state: 'detached' });
            await expect(this.notificationSuccessToast).toBeVisible();
        });
    }

    @step()
    async changeSafetyChecksLevel(level: 'strict' | 'prompt') {
        await this.navigateTo('device');
        await this.safetyChecksButton.click();
        await this.safetyChecksRadioButton(level).click();
        await this.safetyChecksConfirmButton.click();
        await expect(this.confirmOnDevicePrompt).toBeVisible();
        await this.device.pressYes();
    }

    @step()
    async toggleTestnetNetworks() {
        await this.navigateTo('application');
        await this.page.getByTestId('@settings/experimental-features/toggle-switch').click();
        await this.page
            .getByTestId('@settings/experimental-features/testnet-networks-checkbox')
            .click();
    }

    @step()
    async changeNetworks(options: {
        enableNetworks: NetworkSymbol[];
        disableNetworks?: NetworkSymbol[];
    }) {
        await this.navigateTo('coins');
        for (const network of options.enableNetworks) {
            await this.coinsTab.enableNetwork(network);
            if (network === 'ada') {
                await this.coinsTab.temporarilySetOfficialCardanoBackend();
            }
        }

        for (const network of options.disableNetworks ?? []) {
            await this.coinsTab.disableNetwork(network);
        }

        await this.coinsTab.activateCoinsButton.click();
        await this.page.discoveryShouldFinish();
    }

    @step()
    async changeFiatCurrency(currency: BaseCurrencyCode) {
        await this.page.selectDropdownOptionWithRetry(
            this.fiatCurrencyInput,
            this.fiatCurrencyInputOption(currency),
        );
        await expect(this.fiatCurrencyInput).toHaveText(currency.toUpperCase());
    }

    @step()
    async changeBTCUnits(units: 'Bitcoin' | 'Satoshis') {
        await this.page.selectDropdownOptionWithRetry(
            this.btcUnitsInput,
            this.btcUnitsInputOption(units),
        );
        await expect(this.btcUnitsInput).toHaveText(units);
    }

    @step()
    async enableExperimentalFeatures() {
        await this.navigateTo('application');
        await this.experimentalFeaturesSwitch.click();
    }

    @step()
    async verifyDiscoveryLoaderFinishes() {
        await expect(this.settingsLoader, 'Discovery loader should became visible').toBeVisible({
            timeout: 15_000,
        });
        await expect(this.settingsLoader, 'Discovery loader should hide').toBeHidden({
            timeout: 120_000,
        });
    }
}
