import { Locator, Page } from '@playwright/test';

export class TutorialActions {
    readonly skipTutorialButton: Locator;
    readonly tutorialContinueButton: Locator;

    constructor(private readonly page: Page) {
        this.skipTutorialButton = this.page.getByTestId('@tutorial/skip-button');
        this.tutorialContinueButton = this.page.getByTestId('@tutorial/continue-button');
    }

    async skip() {
        await this.skipTutorialButton.click();
        await this.tutorialContinueButton.click();
    }
}
