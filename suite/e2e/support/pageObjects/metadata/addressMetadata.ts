import { expect } from '@playwright/test';

import { MetadataBase } from './metadataBase';
import { step } from '../../common';

export class AddressMetadata extends MetadataBase {
    private readonly addressMetadataTestId = '@metadata/addressLabel';

    readonly addressHoverContainer = (address: string) =>
        this.page.getByTestId(`${this.addressMetadataTestId}/${address}/hover-container`);
    readonly label = (address: string) =>
        this.addressHoverContainer(address).getByTestId(this.inputId);
    readonly editLabelButton = (address: string) =>
        this.addressHoverContainer(address).getByTestId(this.editButtonId);
    readonly deleteLabelButton = (address: string) =>
        this.addressHoverContainer(address).getByTestId(this.deleteButtonId);
    readonly successLabel = (address: string) =>
        this.addressHoverContainer(address).getByTestId(this.successId);

    @step()
    async clickEditLabel(address: string) {
        await this.addressHoverContainer(address).hover();
        await this.editLabelButton(address).click();
    }

    @step()
    async successIconIsVisible(accountId: string) {
        await expect(this.successLabel(accountId)).toBeVisible();
        await expect(this.successLabel(accountId)).toBeHidden();
    }

    @step()
    async changeLabel({ address, label }: { address: string; label: string }) {
        await this.clickEditLabel(address);
        await this.fillLabelInput(label);
        await this.successIconIsVisible(address);
    }

    @step()
    async removeLabel({ address }: { address: string }) {
        await this.addressHoverContainer(address).hover();
        await this.deleteLabelButton(address).click();
        await this.addressHoverContainer(address).hover();
        await this.successIconIsVisible(address);
    }
}
