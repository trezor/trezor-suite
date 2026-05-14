import { Locator, Page, expect } from '@playwright/test';

import type { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../../common';

export class TradingReceiveAccount {
    readonly receiveAddressPicker: Locator;
    readonly selectedReceiveAccount: Locator;

    readonly receiveAccountModal: Locator;
    readonly receiveAccountModalSuiteOption: Locator;
    readonly receiveAccountModalAddSuiteOption: Locator;
    readonly receiveAccountModalNonSuiteOption: Locator;

    readonly receiveAddressModal: Locator;
    readonly receiveAddressModalConfirmButton: Locator;
    readonly receiveAddressInput: Locator;

    readonly extraFieldModal: Locator;
    readonly extraFieldModalConfirmButton: Locator;
    readonly extraFieldSwitch: Locator;
    readonly extraFieldInput: Locator;

    readonly bitcoinReceiveAddressModal: Locator;
    readonly bitcoinReceiveAddressModalOption: Locator;

    readonly findAccountButton: Locator;

    constructor(private readonly page: Page) {
        // receive account & receive address
        this.receiveAddressPicker = this.page.getByTestId('@trading/receive-address-picker');
        this.selectedReceiveAccount = this.page.getByTestId('@trading/selected-receive-account');

        this.receiveAccountModal = this.page.getByTestId('@trading/receive-account-modal');
        this.receiveAccountModalSuiteOption = this.page.getByTestId(
            '@trading/receive-account-modal/option/suite',
        );
        this.receiveAccountModalAddSuiteOption = this.page.getByTestId(
            '@trading/receive-account-modal/option/add-suite',
        );
        this.receiveAccountModalNonSuiteOption = this.page.getByTestId(
            '@trading/receive-account-modal/option/non-suite',
        );

        this.receiveAddressModal = this.page.getByTestId('@trading/receive-address-modal');
        this.receiveAddressModalConfirmButton = this.page.getByTestId(
            '@trading/receive-address-modal/confirm-button',
        );
        this.receiveAddressInput = this.page.getByTestId('@trading/receive-address-input');

        this.extraFieldModal = this.page.getByTestId('@trading/extra-field-modal');
        this.extraFieldModalConfirmButton = this.page.getByTestId(
            '@trading/extra-field-modal/confirm-button',
        );
        this.extraFieldSwitch = this.page.getByTestId('@trading/extra-field-switch');
        this.extraFieldInput = this.page.getByTestId('@trading/extra-field-input');

        this.bitcoinReceiveAddressModal = this.page.getByTestId(
            '@trading/bitcoin-receive-address-modal',
        );
        this.bitcoinReceiveAddressModalOption = this.page.getByTestId(
            '@trading/bitcoin-receive-address-modal/option',
        );

        this.findAccountButton = this.page.getByTestId('@find-account');
    }

    @step()
    async selectSuiteReceiveAccount(index: number, symbol?: NetworkSymbol) {
        await this.receiveAddressPicker.click();
        await expect(this.receiveAccountModal).toBeVisible();

        await this.receiveAccountModalSuiteOption.nth(index).click();

        if (symbol === 'btc') {
            await expect(this.bitcoinReceiveAddressModal).toBeVisible();
            await this.bitcoinReceiveAddressModalOption.nth(0).click();
            await expect(this.bitcoinReceiveAddressModal).toBeHidden();
        }

        await expect(this.receiveAccountModal).toBeHidden();
    }

    @step()
    async selectNonSuiteReceiveAccount(receiveAddress: string, extraField?: string) {
        await this.receiveAddressPicker.click();
        await expect(this.receiveAccountModal).toBeVisible();

        await this.receiveAccountModalNonSuiteOption.nth(0).click();
        await this.receiveAddressInput.fill(receiveAddress);

        if (extraField) {
            await expect(this.extraFieldSwitch).not.toBeChecked();
            await this.extraFieldSwitch.check();
            await this.extraFieldInput.fill(extraField);
        }

        await this.receiveAddressModalConfirmButton.click();
    }

    @step()
    async selectAddSuiteReceiveAccount(index: number) {
        await this.receiveAddressPicker.click();
        await expect(this.receiveAccountModal).toBeVisible();

        await this.receiveAccountModalAddSuiteOption.nth(0).click();
        await this.findAccountButton.click();

        await this.page.discoveryShouldFinish();

        await expect(this.receiveAccountModal).toBeVisible();
        await this.receiveAccountModalSuiteOption.nth(index).click();
    }
}
