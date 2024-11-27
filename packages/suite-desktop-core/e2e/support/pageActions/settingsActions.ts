import { expect, Locator, Page } from '@playwright/test';

import { BackendType, NetworkSymbol } from '@suite-common/wallet-config';

export class SettingsActions {
    private readonly window: Page;
    private readonly TIMES_CLICK_TO_SET_DEBUG_MODE = 5;
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

    constructor(window: Page) {
        this.window = window;
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
        //coin Advance settings
        this.coinBackendSelector = this.window.getByTestId('@settings/advance/select-type/input');
        this.coinAddressInput = this.window.getByTestId('@settings/advance/url');
        this.coinAdvanceSettingSaveButton = this.window.getByTestId(
            '@settings/advance/button/save',
        );
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
        await expect(this.coinNetworkButton(coin)).toHaveAttribute('data-active', 'true');
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
}
