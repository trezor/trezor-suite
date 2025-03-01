import { Locator, Page } from '@playwright/test';

import { step } from '../../common';

export class DeviceTab {
    readonly createMultiShareBackupButton: Locator;
    readonly multiShareBackupGotItButton: Locator;
    private readonly firstInfoSubmitButton: Locator;
    private readonly secondInfoSubmitButton: Locator;

    constructor(private readonly page: Page) {
        this.createMultiShareBackupButton = page.getByTestId(
            '@settings/device/create-multi-share-backup-button',
        );
        this.multiShareBackupGotItButton = page.getByTestId(
            '@multi-share-backup/done/got-it-button',
        );
        this.firstInfoSubmitButton = page.getByTestId('@multi-share-backup/1st-info/submit-button');
        this.secondInfoSubmitButton = page.getByTestId(
            '@multi-share-backup/2nd-info/submit-button',
        );
    }

    @step()
    async proceedMultiShareBackupModal(): Promise<void> {
        await this.page.getByTestId('@multi-share-backup/checkbox/1').click();
        await this.page.getByTestId('@multi-share-backup/checkbox/2').click();
        await this.firstInfoSubmitButton.click();
        await this.secondInfoSubmitButton.click();
    }
}
