import { Locator, Page } from '@playwright/test';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

export class WalletConnectTab {
    readonly addWithButton: Locator;
    readonly uriInput: Locator;
    readonly connectButton: Locator;
    readonly confirmProposalButton: Locator;
    readonly cancelProposalButton: Locator;
    readonly app = (index: number) =>
        this.page.getByTestId(`@settings/walletconnect-apps/${index}`);
    readonly modal: Locator;
    readonly modalHeader: Locator;

    constructor(private readonly page: Page) {
        this.addWithButton = page.getByTestId('@settings/walletconnect/add-with-button');
        this.uriInput = page.getByTestId('@walletconnect/string-input');
        this.connectButton = page.getByTestId('@walletconnect/connect-button');
        this.confirmProposalButton = page.getByTestId('@walletconnect-proposal/confirm-button');
        this.cancelProposalButton = page.getByTestId('@walletconnect-proposal/cancel-button');
        this.modal = page.getByTestId('@modal');
        this.modalHeader = this.modal.getByTestId('@modal/header');
    }

    @step()
    async addWithWalletConnect() {
        await this.addWithButton.click();

        await expect(this.modalHeader).toHaveTranslation('TR_WALLETCONNECT_ADD_CONNECTION');
    }

    @step()
    async addConnection(uri: string) {
        await this.addWithWalletConnect();
        await this.uriInput.fill(uri);
        await this.connectButton.click();

        await expect(this.modalHeader).toHaveTranslation('TR_WALLETCONNECT');
    }

    @step()
    async approveProposal(appInList: number) {
        await this.confirmProposalButton.click();

        await expect(this.app(appInList)).toBeVisible();
    }

    @step()
    async rejectProposal() {
        await this.cancelProposalButton.click();

        await expect(this.modal).toBeHidden();
    }
}
