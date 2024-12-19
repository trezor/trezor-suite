import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { DevicePromptActions } from './devicePromptActions';

export class BackupActions {
    readonly backupStartButton: Locator;
    readonly wroteSeedProperlyCheckbox: Locator;
    readonly madeNoDigitalCopyCheckbox: Locator;
    readonly willHideSeedCheckbox: Locator;
    readonly backupCloseButton: Locator;

    constructor(
        private page: Page,
        private devicePrompt: DevicePromptActions,
    ) {
        this.backupStartButton = page.getByTestId('@backup/start-button');
        this.wroteSeedProperlyCheckbox = page.getByTestId('@backup/check-item/wrote-seed-properly');
        this.madeNoDigitalCopyCheckbox = page.getByTestId(
            '@backup/check-item/made-no-digital-copy',
        );
        this.willHideSeedCheckbox = page.getByTestId('@backup/check-item/will-hide-seed');
        this.backupCloseButton = page.getByTestId('@backup/close-button');
    }

    async passThroughShamirBackup(shares: number, threshold: number) {
        // Backup button should be disabled until all checkboxes are checked
        await expect(this.backupStartButton).toBeDisabled();

        await this.wroteSeedProperlyCheckbox.click();
        await this.madeNoDigitalCopyCheckbox.click();
        await this.willHideSeedCheckbox.click();

        // Create Shamir backup on device
        await this.backupStartButton.click();
        await this.devicePrompt.confirmOnDevicePromptIsShown();

        // Adding delay to mitigate race condition; avoids hitting the homescreen
        await this.page.waitForTimeout(1000);
        await TrezorUserEnvLink.readAndConfirmShamirMnemonicEmu({ shares, threshold });

        await this.backupCloseButton.click();
    }
}
