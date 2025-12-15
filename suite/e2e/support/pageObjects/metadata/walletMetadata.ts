import { expect } from '@playwright/test';

import { MetadataBase } from './metadataBase';
import { step } from '../../common';

export class WalletMetadata extends MetadataBase {
    readonly walletLabel = (index: number) => this.walletOnIndex(index).getByTestId(this.inputId);
    readonly walletOnIndex = (index: number) =>
        this.page.getByTestId(`@switch-device/wallet-on-index/${index}`);
    readonly labelChangeSuccessIcon = (index: number) =>
        this.walletOnIndex(index).getByTestId(this.successId);
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
}
