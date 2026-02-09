import { expect } from '@playwright/test';

import { MetadataBase } from './metadataBase';
import { step } from '../../common';

export class OutputMetadata extends MetadataBase {
    readonly outputLabel = (outputId: string, txNumber: number) =>
        this.page.getByTestId(`${this.getLabelTestId(outputId, txNumber)}/hover-container`);
    readonly outputMetadataInput = (outputId: string, txNumber: number) =>
        this.outputLabel(outputId, txNumber).getByTestId(this.inputId);

    private getLabelTestId(outputId: string, txNumber: number): string {
        return `@metadata/outputLabel/${outputId}-${txNumber}`;
    }

    @step()
    async clickAddLabelButton(outputId: string, txNumber: number) {
        await this.page.resetMousePosition();
        await expect(this.outputLabel(outputId, txNumber)).toHaveText(/[A-Za-z]+/);
        await this.outputLabel(outputId, txNumber).hover();
        await this.page.waitForTimeout(500); // edit button is unstable without this wait
        await this.outputLabel(outputId, txNumber).getByTestId(this.editButtonId).click();
    }

    @step()
    async editLabel(outputId: string, txNumber: number, label: string) {
        await this.clickAddLabelButton(outputId, txNumber);
        await this.outputMetadataInput(outputId, txNumber).fill(label);
        await this.page.keyboard.press('Enter');
    }
}
