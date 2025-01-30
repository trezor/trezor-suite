import { MetadataBaseActions } from './metadataBaseActions';
import { step } from '../../common';

export class OutputMetadataActions extends MetadataBaseActions {
    readonly outputLabel = (outputId: string, txNumber: number) =>
        this.page.getByTestId(`${this.getLabelTestId(outputId, txNumber)}/hover-container`);
    readonly outputDropdownCopyAddress = (outputId: string, txNumber: number) =>
        this.page.getByTestId(`${this.getLabelTestId(outputId, txNumber)}/dropdown/copy-address`);
    readonly outputDropdownEditLabel = (outputId: string, txNumber: number) =>
        this.page.getByTestId(`${this.getLabelTestId(outputId, txNumber)}/dropdown/edit-label`);

    private getLabelTestId(outputId: string, txNumber: number): string {
        return `@metadata/outputLabel/${outputId}-${txNumber}`;
    }

    @step()
    async clickAddLabelButton(outputId: string, txNumber: number) {
        await this.outputLabel(outputId, txNumber).hover();
        await this.page
            .getByTestId(`${this.getLabelTestId(outputId, txNumber)}/add-label-button`)
            .click();
    }

    @step()
    async addLabel(outputId: string, txNumber: number, label: string) {
        await this.clickAddLabelButton(outputId, txNumber);
        await this.fillLabelInput(label);
    }

    @step()
    async editLabel(outputId: string, txNumber: number, newLabel: string) {
        await this.outputLabel(outputId, txNumber).click();
        await this.outputDropdownEditLabel(outputId, txNumber).click();
        await this.fillLabelInput(newLabel);
    }
}
