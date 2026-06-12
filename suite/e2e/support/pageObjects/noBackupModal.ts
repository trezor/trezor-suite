import { Locator, Page } from '@playwright/test';

export class NoBackupModal {
    readonly takeRiskButton: Locator;

    constructor(page: Page) {
        this.takeRiskButton = page.getByTestId('@no-backup/take-risk-button');
    }
}
