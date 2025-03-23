import { Locator, Page, expect } from '@playwright/test';

import { step } from '../common';

export class RecoveryModal {
    readonly selectBasicRecoveryButton: Locator;
    readonly userUnderstandsCheckbox: Locator;
    readonly startButton: Locator;
    readonly successTitle: Locator;
    readonly header: Locator;
    readonly prompt: Locator;

    constructor(private page: Page) {
        this.selectBasicRecoveryButton = page.getByTestId('@recover/select-type/basic');
        this.userUnderstandsCheckbox = page.getByTestId('@recovery/user-understands-checkbox');
        this.startButton = page.getByTestId('@recovery/start-button');
        this.successTitle = page.getByTestId('@recovery/success-title');
        this.header = page.getByTestId('@modal/header');
        this.prompt = page.getByTestId('@modal').getByRole('paragraph');
    }

    @step()
    async selectWordCount(number: 12 | 18 | 24) {
        await this.page.getByTestId(`@recover/select-count/${number}`).click();
    }

    @step()
    async initDryCheck(type: 'basic' | 'advanced', numberOfWords: 12 | 18 | 24) {
        await this.userUnderstandsCheckbox.click();
        await this.startButton.click();
        await this.selectWordCount(numberOfWords);
        await this.page.getByTestId(`@recover/select-type/${type}`).click();
    }

    @step()
    async verifyDryCheckPrompt() {
        await expect(this.header).toHaveText('Check wallet backup', { timeout: 30_000 });
        await expect(this.prompt).toHaveText(
            'Enter the words directly on your Trezor device in the correct order.',
        );
    }
}
