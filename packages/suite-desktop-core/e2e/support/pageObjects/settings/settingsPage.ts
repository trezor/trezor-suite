import { Locator, Page, test } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { capitalizeFirstLetter } from '@trezor/utils';

import { CoinsTab } from './coinsTab';
import { DeviceTab } from './deviceTab';
import { TrezorUserEnvLinkProxy, step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

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
    nyancat: {
        path: 'static/images/homescreens/BW_64x128/nyancat.png',
        locator: '@modal/gallery/bw_64x128/nyancat',
    },
};

export class SettingsPage {
    private readonly TIMES_CLICK_TO_SET_DEBUG_MODE = 5;
    readonly coins: CoinsTab;
    readonly device: DeviceTab;

    readonly settingsMenuButton: Locator;
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
    readonly metadataSwitch: Locator;
    readonly analyticsSwitch: Locator;
    readonly showLogButton: Locator;

    constructor(
        private readonly page: Page,
        private readonly apiURL: string,
    ) {
        this.coins = new CoinsTab(page);
        this.device = new DeviceTab(page);

        this.settingsMenuButton = this.page.getByTestId('@suite/menu/settings');
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
        this.modal = this.page.getByTestId('@modal');
        this.modalCloseButton = this.page.getByTestId('@modal/close-button');
        this.deviceLabelInput = this.page.getByTestId('@settings/device/label-input');
        this.deviceLabelSubmit = this.page.getByTestId('@settings/device/label-submit');
        this.confirmOnDevicePrompt = this.page.getByTestId('@prompts/confirm-on-device');
        this.homescreenGalleryButton = this.page.getByTestId('@settings/device/homescreen-gallery');
        this.notificationSuccessToast = this.page.getByTestId('@toast/settings-applied').first();
        this.themeInput = this.page.getByTestId('@theme/color-scheme-select/input');
        this.languageInput = this.page.getByTestId('@settings/language-select/input');
        this.checkSeedButton = this.page.getByTestId('@settings/device/check-seed-button');
        this.metadataSwitch = this.page.getByTestId('@settings/metadata-switch');
        this.analyticsSwitch = this.page.getByTestId('@analytics/toggle-switch');
        this.showLogButton = this.page.getByTestId('@settings/show-log-button');
    }

    @step()
    async navigateTo(tab: 'application' | 'coins' | 'device' | 'debug' | 'connect') {
        const notInSettings = !(await this.settingsHeader.isVisible());
        if (notInSettings) {
            await this.settingsMenuButton.click();
            await expect(this.settingsHeader).toHaveText('Settings', { timeout: 10000 });
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
        await this.selectDropdownOptionWithRetry(this.themeInput, this.themeInputOption(theme));
        await expect(this.themeInput).toHaveText(capitalizeFirstLetter(theme));
    }

    @step()
    async changeLanguage(language: Language) {
        await this.selectDropdownOptionWithRetry(
            this.languageInput,
            this.languageInputOption(language),
        );
        await expect(this.languageInput).toHaveText(languageMap[language]);
    }

    //Retry mechanism for settings dropdowns which tend to be flaky in automation
    @step()
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

    @step()
    async changeDeviceName(newDeviceName: string) {
        await this.deviceLabelInput.clear();
        await this.deviceLabelInput.fill(newDeviceName);
        await this.deviceLabelSubmit.click();
        await expect(this.confirmOnDevicePrompt).toBeVisible();
        await TrezorUserEnvLinkProxy.pressYes();
        await this.confirmOnDevicePrompt.waitFor({ state: 'detached' });
        await expect(this.notificationSuccessToast).toBeVisible();
    }

    @step()
    async changeDeviceBackground(image: keyof typeof backgroundImages) {
        await test.step('Change display background image', async () => {
            // To solve the flakiness of the test, we need to wait for the image to load
            const buttonImageLoad = this.page.waitForResponse(
                `${this.apiURL}${backgroundImages[image].path}`,
            );
            await this.homescreenGalleryButton.click();
            await buttonImageLoad;
            await this.page.getByTestId(backgroundImages[image].locator).click();
            await expect(this.confirmOnDevicePrompt).toBeVisible();
            await TrezorUserEnvLinkProxy.pressYes();
            await this.confirmOnDevicePrompt.waitFor({ state: 'detached' });
            await expect(this.notificationSuccessToast).toBeVisible();
        });
    }

    @step()
    async changeSafetyChecksLevel(level: 'strict' | 'prompt') {
        await this.navigateTo('device');
        await this.page.getByTestId('@settings/device/safety-checks-button').click();
        await this.page.getByTestId(`@radio-button-${level}`).click();
        await this.page.getByTestId('@safety-checks-apply').click();
        await expect(this.confirmOnDevicePrompt).toBeVisible();
        await TrezorUserEnvLinkProxy.pressYes();
    }

    @step()
    async changeNetworks(options: {
        enableNetworks: NetworkSymbol[];
        disableNetworks?: NetworkSymbol[];
    }) {
        await this.navigateTo('coins');
        for (const network of options.enableNetworks) {
            await this.coins.enableNetwork(network);
        }

        for (const network of options.disableNetworks ?? []) {
            await this.coins.disableNetwork(network);
        }

        await this.coins.activateCoinsButton.click();
        await this.page.discoveryShouldFinish();
    }
}
