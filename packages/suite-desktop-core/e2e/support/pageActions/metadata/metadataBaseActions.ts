import { Locator, Page } from '@playwright/test';

import { step } from '../../common';

interface MetadataSubmitOptions {
    useButton?: boolean;
}

export class MetadataBaseActions {
    readonly metadataSubmitButton: Locator;
    readonly metadataCancelButton: Locator;
    readonly metadataInput: Locator;

    constructor(protected readonly page: Page) {
        this.metadataSubmitButton = page.getByTestId('@metadata/submit');
        this.metadataCancelButton = page.getByTestId('@metadata/cancel');
        this.metadataInput = page.getByTestId('@metadata/input');
    }

    @step()
    async fillLabelInput(label: string, options?: MetadataSubmitOptions) {
        await this.metadataInput.fill(label);

        if (options?.useButton) {
            await this.metadataSubmitButton.click();

            return;
        }

        await this.page.keyboard.press('Enter');
    }
}
