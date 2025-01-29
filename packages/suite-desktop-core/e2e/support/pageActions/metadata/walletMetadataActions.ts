import { step } from '../../common';
import { MetadataBaseActions } from './metadataBaseActions';

export class WalletMetadataActions extends MetadataBaseActions {
    private readonly walletSelectorBeginPart = '[data-testid^="@metadata/walletLabel/"]';
    readonly walletLabel = (index: number) =>
        this.page.locator(`${this.walletSelectorBeginPart}[data-testid$=":${index + 1}"]`);

    @step()
    async clickAddLabel(index: number) {
        await this.page.waitForTimeout(2000); // I couldn't figure out any other working solution for flaky hover+click
        await this.page
            .locator(
                `${this.walletSelectorBeginPart}[data-testid$=":${index + 1}/hover-container"]`,
            )
            .hover();
        await this.page
            .locator(
                `${this.walletSelectorBeginPart}[data-testid$=":${index + 1}/add-label-button"]`,
            )
            .click();
    }

    @step()
    async clickEditLabel(index: number) {
        await this.page.waitForTimeout(2000); // I couldn't figure out any other working solution for flaky hover+click
        await this.page
            .locator(
                `${this.walletSelectorBeginPart}[data-testid$=":${index + 1}/hover-container"]`,
            )
            .hover();
        await this.page
            .locator(
                `${this.walletSelectorBeginPart}[data-testid$=":${index + 1}/edit-label-button"]`,
            )
            .click();
    }
}
