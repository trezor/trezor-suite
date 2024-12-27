import { Locator, Page } from '@playwright/test';

export class RecoveryActions {
    readonly selectBasicRecoveryButton: Locator;
    readonly userUnderstandsCheckbox: Locator;
    readonly startButton: Locator;
    readonly successTitle: Locator;

    constructor(private page: Page) {
        this.selectBasicRecoveryButton = page.getByTestId('@recover/select-type/basic');
        this.userUnderstandsCheckbox = page.getByTestId('@recovery/user-understands-checkbox');
        this.startButton = page.getByTestId('@recovery/start-button');
        this.successTitle = page.getByTestId('@recovery/success-title');
    }

    async selectWordCount(number: 12 | 18 | 24) {
        await this.page.getByTestId(`@recover/select-count/${number}`).click();
    }

    async initDryCheck(type: 'basic' | 'advanced', numberOfWords: 12 | 18 | 24) {
        await this.userUnderstandsCheckbox.click();
        await this.startButton.click();
        await this.selectWordCount(numberOfWords);
        await this.page.getByTestId(`@recover/select-type/${type}`).click();
    }
}
