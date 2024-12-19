import { Locator, Page } from '@playwright/test';

export class RecoverActions {
    readonly selectBasicRecoveryButton: Locator;

    constructor(private page: Page) {
        this.selectBasicRecoveryButton = page.getByTestId('@recover/select-type/basic');
    }

    async selectWordCount(number: number) {
        await this.page.getByTestId(`@recover/select-count/${number}`).click();
    }
}
