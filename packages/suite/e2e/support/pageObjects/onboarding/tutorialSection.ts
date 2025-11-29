import { Locator, Page } from '@playwright/test';

import { step } from '../../common';

export class TutorialSection {
    readonly skipTutorialButton: Locator;

    constructor(private readonly page: Page) {
        this.skipTutorialButton = this.page.getByTestId('@tutorial/skip-button');
    }

    @step()
    async skip() {
        await this.skipTutorialButton.click();
    }
}
