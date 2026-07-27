import { expect } from '@playwright/test';

import { MetadataBase } from './metadataBase';
import { step } from '../../common';

export class WalletMetadata extends MetadataBase {
    readonly walletLabel = (index: number) => this.walletOnIndex(index).getByTestId(this.inputId);
    readonly walletOnIndex = (index: number) =>
        this.page.getByTestId(`@switch-device/wallet-on-index/${index}`);
    readonly labelChangeSuccessIcon = (index: number) =>
        this.walletOnIndex(index).getByTestId(this.successId);
    readonly deleteLabelButton = (index: number) =>
        this.walletOnIndex(index).getByTestId(this.deleteButtonId);

    @step()
    async clickEditLabel(index: number) {
        await this.page.resetMousePosition();
        // ensure wallet label is loaded - test can be too fast
        await expect(this.walletLabel(index)).toHaveText(/[A-Za-z]+/);
        await this.walletOnIndex(index).getByTestId(this.inputId).hover();
        await this.walletOnIndex(index).getByTestId(this.editButtonId).click();
    }

    @step()
    async successIconIsVisible(standardWalletIndex: number) {
        await expect(this.labelChangeSuccessIcon(standardWalletIndex)).toBeVisible();
        await expect(this.labelChangeSuccessIcon(standardWalletIndex)).toBeHidden();
    }

    @step()
    async changeLabel({
        index,
        label,
        confirmSuiteSync,
    }: {
        index: number;
        label: string;
        confirmSuiteSync?: boolean;
    }) {
        await this.clickEditLabel(index);
        await this.fillLabelInput(label);
        if (confirmSuiteSync) {
            await this.devicePrompt.confirmSuiteSyncSetup();
        } else {
            // success icon is not visible after device confirms keys on first label change
            await this.successIconIsVisible(index);
        }
    }

    @step()
    async removeLabel({ index }: { index: number }) {
        await this.page.resetMousePosition();
        await expect(this.walletLabel(index)).toHaveText(/[A-Za-z]+/);
        await this.walletLabel(index).hover();
        await this.deleteLabelButton(index).click();
        await this.walletLabel(index).hover();
        await this.successIconIsVisible(index);
    }
}
