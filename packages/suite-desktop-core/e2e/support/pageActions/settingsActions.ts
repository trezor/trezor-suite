import { Locator, Page, test } from '@playwright/test';

import { BackendType, NetworkSymbol } from '@suite-common/wallet-config';
import { capitalizeFirstLetter } from '@trezor/utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { expect } from '../customMatchers';

export enum Theme {
    System = 'system',
    Dark = 'dark',
    Light = 'light',
}

export enum Language {
    Spanish = 'es',
}

const languageMap = {
    es: 'Español',
};

const backgroundImages = {
    original_t2t1: {
        path: 'static/images/homescreens/COLOR_240x240/original_t2t1.jpg',
        locator: '@modal/gallery/color_240x240/original_t2t1',
    },
    circleweb: {
        path: 'static/images/homescreens/BW_64x128/circleweb.png',
        locator: '@modal/gallery/bw_64x128/circleweb',
    },
};

export class SettingsActions {
    private readonly window: Page;
    private readonly apiURL: string;
    private readonly TIMES_CLICK_TO_SET_DEBUG_MODE = 5;
    readonly settingsMenuButton: Locator;
    readonly settingsHeader: Locator;
    readonly debugTabButton: Locator;
    readonly applicationTabButton: Locator;
    readonly deviceTabButton: Locator;
    readonly coinsTabButton: Locator;
    readonly earlyAccessJoinButton: Locator;
    readonly earlyAccessConfirmCheck: Locator;
    readonly earlyAccessConfirmButton: Locator;
    readonly earlyAccessSkipButton: Locator;
    readonly settingsCloseButton: Locator;
    readonly modal: Locator;
    readonly deviceLabelInput: Locator;
    readonly deviceLabelSubmit: Locator;
    readonly confirmOnDevicePrompt: Locator;
    readonly homescreenGalleryButton: Locator;
    //coin Advance settings
    readonly coinNetworkButton = (coin: NetworkSymbol) =>
        this.window.getByTestId(`@settings/wallet/network/${coin}`);
    readonly coinAdvanceSettingsButton = (coin: NetworkSymbol) =>
        this.window.getByTestId(`@settings/wallet/network/${coin}/advance`);
    readonly coinBackendSelector: Locator;
    readonly coinBackendSelectorOption = (backend: BackendType) =>
        this.window.getByTestId(`@settings/advance/${backend}`);
    readonly coinAddressInput: Locator;
    readonly coinAdvanceSettingSaveButton: Locator;
    readonly themeInput: Locator;
    readonly themeInputOption = (theme: Theme) =>
        this.window.getByTestId(`@theme/color-scheme-select/option/${theme}`);
    readonly languageInput: Locator;
    readonly languageInputOption = (language: Language) =>
        this.window.getByTestId(`@settings/language-select/option/${language}`);

    constructor(window: Page, apiURL: string) {
        this.window = window;
        this.apiURL = apiURL;
        this.settingsMenuButton = this.window.getByTestId('@suite/menu/settings');
        this.settingsHeader = this.window.getByTestId('@settings/menu/title');
        this.debugTabButton = this.window.getByTestId('@settings/menu/debug');
        this.applicationTabButton = this.window.getByTestId('@settings/menu/general');
        this.deviceTabButton = this.window.getByTestId('@settings/menu/device');
        this.coinsTabButton = this.window.getByTestId('@settings/menu/wallet');
        this.earlyAccessJoinButton = this.window.getByTestId('@settings/early-access-join-button');
        this.earlyAccessConfirmCheck = this.window.getByTestId(
            '@settings/early-access-confirm-check',
        );
        this.earlyAccessConfirmButton = this.window.getByTestId(
            '@settings/early-access-confirm-button',
        );
        this.earlyAccessSkipButton = this.window.getByTestId('@settings/early-access-skip-button');
        this.settingsCloseButton = this.window.getByTestId('@settings/menu/close');
        this.modal = this.window.getByTestId('@modal');
        this.deviceLabelInput = this.window.getByTestId('@settings/device/label-input');
        this.deviceLabelSubmit = this.window.getByTestId('@settings/device/label-submit');
        this.confirmOnDevicePrompt = this.window.getByTestId('@prompts/confirm-on-device');
        this.homescreenGalleryButton = this.window.getByTestId(
            '@settings/device/homescreen-gallery',
        );
        //coin Advance settings
        this.coinBackendSelector = this.window.getByTestId('@settings/advance/select-type/input');
        this.coinAddressInput = this.window.getByTestId('@settings/advance/url');
        this.coinAdvanceSettingSaveButton = this.window.getByTestId(
            '@settings/advance/button/save',
        );
        this.themeInput = this.window.getByTestId('@theme/color-scheme-select/input');
        this.languageInput = this.window.getByTestId('@settings/language-select/input');
    }

    async navigateTo() {
        await this.settingsMenuButton.click();
        await expect(this.settingsHeader).toHaveText('Settings', { timeout: 10000 });
    }

    async toggleDebugModeInSettings() {
        await expect(this.settingsHeader).toBeVisible();
        for (let i = 0; i < this.TIMES_CLICK_TO_SET_DEBUG_MODE; i++) {
            await this.settingsHeader.click();
        }
        await expect(this.debugTabButton).toBeVisible();
    }

    async openCoinAdvanceSettings(coin: NetworkSymbol) {
        const isCoinActive = await this.coinNetworkButton(coin).getAttribute('data-active');
        if (isCoinActive === 'false') {
            await this.enableCoin(coin);
        }
        await this.coinNetworkButton(coin).hover();
        await this.coinAdvanceSettingsButton(coin).click();
        await expect(this.modal).toBeVisible();
    }

    async enableCoin(coin: NetworkSymbol) {
        await this.coinNetworkButton(coin).click();
        await expect(this.coinNetworkButton(coin)).toBeEnabledCoin();
    }

    async disableCoin(coin: NetworkSymbol) {
        await this.coinNetworkButton(coin).click();
        await expect(this.coinNetworkButton(coin)).toBeDisabledCoin();
    }

    async changeCoinBackend(backend: BackendType, backendUrl: string) {
        await this.coinBackendSelector.click();
        await this.coinBackendSelectorOption(backend).click();
        await this.coinAddressInput.fill(backendUrl);
        await this.coinAdvanceSettingSaveButton.click();
    }

    async joinEarlyAccessProgram() {
        await this.earlyAccessJoinButton.scrollIntoViewIfNeeded();
        await this.earlyAccessJoinButton.click();
        await expect(this.modal).toBeVisible();
        await this.earlyAccessConfirmCheck.click();
        await this.earlyAccessConfirmButton.click();
        await this.earlyAccessSkipButton.click();
    }

    async closeSettings() {
        await this.settingsCloseButton.click();
        await this.settingsHeader.waitFor({ state: 'detached' });
    }

    async changeTheme(theme: Theme) {
        await this.selectDropdownOptionWithRetry(this.themeInput, this.themeInputOption(theme));
        await expect(this.themeInput).toHaveText(capitalizeFirstLetter(theme));
    }

    async changeLanguage(language: Language) {
        await this.selectDropdownOptionWithRetry(
            this.languageInput,
            this.languageInputOption(language),
        );
        await expect(this.languageInput).toHaveText(languageMap[language]);
    }

    //Retry mechanism for settings dropdowns which tend to be flaky in automation
    async selectDropdownOptionWithRetry(dropdown: Locator, option: Locator) {
        await test.step('Select dropdown option with RETRY', async () => {
            await dropdown.scrollIntoViewIfNeeded();
            await expect(async () => {
                if (!(await option.isVisible())) {
                    await dropdown.click({ timeout: 2000 });
                }
                await expect(option).toBeVisible({ timeout: 2000 });
                await option.click({ timeout: 2000 });
            }).toPass({ timeout: 10_000 });
        });
    }

    async changeDeviceName(newDeviceName: string) {
        await this.deviceLabelInput.clear();
        await this.deviceLabelInput.fill(newDeviceName);
        await this.deviceLabelSubmit.click();
        await expect(this.confirmOnDevicePrompt).toBeVisible();
        await TrezorUserEnvLink.pressYes();
        await this.confirmOnDevicePrompt.waitFor({ state: 'detached' });
    }

    async changeDeviceBackground(image: keyof typeof backgroundImages) {
        await test.step('Change display background image', async () => {
            // To solve the flakiness of the test, we need to wait for the image to load
            const buttonImageLoad = this.window.waitForResponse(
                `${this.apiURL}${backgroundImages[image].path}`,
            );
            await this.homescreenGalleryButton.click();
            await buttonImageLoad;
            await this.window.getByTestId(backgroundImages[image].locator).click();
            await expect(this.confirmOnDevicePrompt).toBeVisible();
            await TrezorUserEnvLink.pressYes();
            await this.confirmOnDevicePrompt.waitFor({ state: 'detached' });
        });
    }
}
