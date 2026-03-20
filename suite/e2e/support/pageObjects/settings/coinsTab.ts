import { Locator, Page } from '@playwright/test';

import type { BackendType, NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

export class CoinsTab {
    readonly networkButton = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@settings/wallet/network/${symbol}`);
    readonly networkAddButton = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@settings/wallet/network/${symbol}/add-button`);
    readonly networkSwitch = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@settings/wallet/network/${symbol}/switch`);
    readonly networkSwitchInput = (symbol: NetworkSymbol) =>
        this.networkSwitch(symbol).getByRole('switch');
    readonly networkBackendStatus = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@settings/wallet/network/${symbol}/backend-status`);
    readonly networkSymbolAdvanceSettingsButton = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@settings/wallet/network/${symbol}/advance`);
    readonly coinBackendSelector: Locator;
    readonly coinBackendSelectorOption = (backend: BackendType) =>
        this.page.getByTestId(`@settings/advance/${backend}`);
    readonly coinAddressInput: Locator;
    readonly coinAdvanceSettingSaveButton: Locator;
    readonly modal: Locator;
    readonly activateCoinsButton: Locator;

    constructor(private readonly page: Page) {
        this.coinBackendSelector = this.page.getByTestId('@settings/advance/select-type/input');
        this.coinAddressInput = this.page.getByTestId('@settings/advance/url');
        this.coinAdvanceSettingSaveButton = this.page.getByTestId('@settings/advance/button/save');
        this.modal = this.page.modal;
        this.activateCoinsButton = this.page.getByTestId('@settings-coins/discovery-button');
    }

    @step()
    async openNetworkAdvanceSettings(symbol: NetworkSymbol) {
        if (!(await this.isNetworkEnabled(symbol))) {
            await this.enableNetwork(symbol);
        }
        await this.networkButton(symbol).hover();
        await this.networkSymbolAdvanceSettingsButton(symbol).click();
        await expect(this.modal).toBeVisible();
    }

    @step()
    async isNetworkEnabled(symbol: NetworkSymbol) {
        return (await this.networkSwitchInput(symbol).getAttribute('aria-checked')) === 'true';
    }

    @step()
    async expectNetworkEnabled(symbol: NetworkSymbol) {
        await expect(this.networkSwitchInput(symbol)).toHaveAttribute('aria-checked', 'true');
    }

    @step()
    async expectNetworkDisabled(symbol: NetworkSymbol) {
        await expect(this.networkSwitchInput(symbol)).toHaveAttribute('aria-checked', 'false');
    }

    @step()
    async expectCustomBackendIndicator(symbol: NetworkSymbol) {
        await expect(this.networkBackendStatus(symbol)).toBeVisible();
    }

    @step()
    async enableNetwork(symbol: NetworkSymbol) {
        const networkSwitch = this.networkSwitch(symbol);
        if (!(await this.isNetworkEnabled(symbol))) {
            await networkSwitch.click();
        }
        await this.expectNetworkEnabled(symbol);
    }

    @step()
    async disableNetwork(symbol: NetworkSymbol) {
        const networkSwitch = this.networkSwitch(symbol);
        if (await this.isNetworkEnabled(symbol)) {
            await networkSwitch.click();
        }
        await this.expectNetworkDisabled(symbol);
    }

    @step()
    async changeBackend(backend: BackendType, backendUrl: string) {
        await this.coinBackendSelector.click();
        await this.coinBackendSelectorOption(backend).click();
        await this.coinAddressInput.fill(backendUrl);
        await this.coinAdvanceSettingSaveButton.click();
    }
}
