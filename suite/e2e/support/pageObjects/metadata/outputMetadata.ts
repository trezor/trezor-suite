import { expect } from '@playwright/test';

import { MetadataBase } from './metadataBase';
import { step } from '../../common';

export class OutputMetadata extends MetadataBase {
    readonly outputLabel = (outputId: string, txNumber: number) =>
        this.page.getByTestId(`${this.getLabelTestId(outputId, txNumber)}/hover-container`);
    readonly outputMetadataInput = (outputId: string, txNumber: number) =>
        this.outputLabel(outputId, txNumber).getByTestId(this.inputId);
    readonly labelChangeSuccessIcon = (outputId: string, txNumber: number) =>
        this.outputLabel(outputId, txNumber).getByTestId(this.successId);
    readonly deleteLabelButton = (outputId: string, txNumber: number) =>
        this.outputLabel(outputId, txNumber).getByTestId(this.deleteButtonId);

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
    async successIconIsVisible(outputId: string, txNumber: number) {
        await expect(this.labelChangeSuccessIcon(outputId, txNumber)).toBeVisible();
        await expect(this.labelChangeSuccessIcon(outputId, txNumber)).toBeHidden();
    }

    @step()
    async changeLabel({
        outputId,
        txNumber,
        label,
    }: {
        outputId: string;
        txNumber: number;
        label: string;
    }) {
        await this.clickAddLabelButton(outputId, txNumber);
        await this.outputMetadataInput(outputId, txNumber).fill(label);
        await this.page.keyboard.press('Enter');
        await this.successIconIsVisible(outputId, txNumber);
    }

    @step()
    async removeLabel({ outputId, txNumber }: { outputId: string; txNumber: number }) {
        await this.page.resetMousePosition();
        await expect(this.outputLabel(outputId, txNumber)).toHaveText(/[A-Za-z]+/);
        await this.outputLabel(outputId, txNumber).hover();
        await this.page.waitForTimeout(500); // delete button is unstable without this wait
        await this.deleteLabelButton(outputId, txNumber).click();
        await this.outputLabel(outputId, txNumber).hover();
        await this.successIconIsVisible(outputId, txNumber);
    }
}
