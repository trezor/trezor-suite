import { Locator, Page } from '@playwright/test';

import { step } from '../common';
import { expect } from '../testExtends/customMatchers';

export class RecoveryModal {
    readonly selectRecoveryButton = (type: 'standard' | 'advanced') =>
        this.page.getByTestId(`@recovery/select-type/${type}`);
    readonly userUnderstandsCheckbox: Locator;
    readonly startButton: Locator;
    readonly continueButton: Locator;
    readonly successTitle: Locator;
    readonly header: Locator;
    readonly prompt: Locator;
    readonly wordInputAtIndex = (index: number) =>
        this.page.getByTestId(`@recovery/word-input-advanced/${index}`);

    constructor(private page: Page) {
        this.userUnderstandsCheckbox = page.getByTestId('@recovery/user-understands-checkbox');
        this.startButton = page.getByTestId('@recovery/start-button');
        this.continueButton = page.getByTestId('@recovery/continue-button');
        this.successTitle = page.getByTestId('@recovery/success-title');
        this.header = page.modalHeader;
        this.prompt = page.modal.getByTestId('@recovery/paragraph');
    }

    @step()
    async selectWordCount(number: 12 | 18 | 24) {
        await this.page.getByTestId(`@recovery/select-count/${number}`).click();
    }

    @step()
    async initDryCheck(type: 'standard' | 'advanced', numberOfWords: 12 | 18 | 24) {
        await this.userUnderstandsCheckbox.click();
        await this.startButton.click();
        await this.selectWordCount(numberOfWords);
        await this.continueButton.click();
        await this.selectRecoveryButton(type).click();
        await this.continueButton.click();
    }

    @step()
    async verifyDryCheckPrompt() {
        await expect(this.header).toHaveTranslation('TR_CHECK_RECOVERY_SEED', { timeout: 30_000 });
        await expect(this.prompt).toHaveTranslation('TR_ENTER_SEED_WORDS_ON_DEVICE');
    }
}
