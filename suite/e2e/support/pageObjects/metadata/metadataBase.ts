import { Locator, Page } from '@playwright/test';

import { step } from '../../common';

interface MetadataSubmitOptions {
    useButton?: boolean;
}

export class MetadataBase {
    readonly metadataSubmitButton: Locator;
    readonly metadataCancelButton: Locator;
    readonly metadataInput: Locator;
    readonly editButtonId = '@metadata/edit';
    readonly deleteButtonId = '@metadata/delete';
    readonly inputId = '@metadata/input';
    readonly successId = '@metadata/success';

    constructor(protected readonly page: Page) {
        this.metadataSubmitButton = page.getByTestId('@metadata/submit');
        this.metadataCancelButton = page.getByTestId('@metadata/cancel');
        this.metadataInput = page
            .getByTestId('@metadata/input')
            .and(page.locator('[contenteditable="true"]'));
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
