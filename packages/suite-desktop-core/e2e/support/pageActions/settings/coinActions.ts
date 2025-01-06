import { Locator, Page } from '@playwright/test';

import { BackendType, NetworkSymbol } from '@suite-common/wallet-config';

import { expect } from '../../customMatchers';
import { step } from '../../common';

export class CoinsActions {
    readonly networkButton = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@settings/wallet/network/${symbol}`);
    readonly networkSymbolAdvanceSettingsButton = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@settings/wallet/network/${symbol}/advance`);
    readonly coinBackendSelector: Locator;
    readonly coinBackendSelectorOption = (backend: BackendType) =>
        this.page.getByTestId(`@settings/advance/${backend}`);
    readonly coinAddressInput: Locator;
    readonly coinAdvanceSettingSaveButton: Locator;
    readonly modal: Locator;

    constructor(private readonly page: Page) {
        this.coinBackendSelector = this.page.getByTestId('@settings/advance/select-type/input');
        this.coinAddressInput = this.page.getByTestId('@settings/advance/url');
        this.coinAdvanceSettingSaveButton = this.page.getByTestId('@settings/advance/button/save');
        this.modal = this.page.getByTestId('@modal');
    }

    @step()
    async openNetworkAdvanceSettings(symbol: NetworkSymbol) {
        const isNetworkActive = await this.networkButton(symbol).getAttribute('data-active');
        if (isNetworkActive === 'false') {
            await this.enableNetwork(symbol);
        }
        await this.networkButton(symbol).hover();
        await this.networkSymbolAdvanceSettingsButton(symbol).click();
        await expect(this.modal).toBeVisible();
    }

    @step()
    async enableNetwork(symbol: NetworkSymbol) {
        await this.networkButton(symbol).click();
        await expect(this.networkButton(symbol)).toBeEnabledCoin();
    }

    @step()
    async disableNetwork(symbol: NetworkSymbol) {
        await this.networkButton(symbol).click();
        await expect(this.networkButton(symbol)).toBeDisabledCoin();
    }

    @step()
    async changeBackend(backend: BackendType, backendUrl: string) {
        await this.coinBackendSelector.click();
        await this.coinBackendSelectorOption(backend).click();
        await this.coinAddressInput.fill(backendUrl);
        await this.coinAdvanceSettingSaveButton.click();
    }
}
