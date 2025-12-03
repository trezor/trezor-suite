import { MetadataBase } from './metadataBase';
import { step } from '../../common';

export class AddressMetadata extends MetadataBase {
    private readonly addressMetadataTestId = '@metadata/addressLabel';

    private readonly labelHoverContainer = (address: string) =>
        this.page.getByTestId(`${this.addressMetadataTestId}/${address}/hover-container`);
    readonly label = (address: string) =>
        this.page.getByTestId(`${this.addressMetadataTestId}/${address}`);

    @step()
    async clickAddLabel(address: string) {
        await this.labelHoverContainer(address).hover();
        await this.page
            .getByTestId(`${this.addressMetadataTestId}/${address}/add-label-button`)
            .click();
    }

    @step()
    async clickEditLabel(address: string) {
        await this.labelHoverContainer(address).hover();
        await this.page
            .getByTestId(`${this.addressMetadataTestId}/${address}/edit-label-button`)
            .click();
    }
}
