import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLinkProxy, step } from '../../common';
import { DevicePrompt } from '../devicePrompt';

export class BackupSection {
    readonly startButton: Locator;
    readonly understandWhatSeedIsCheckbox: Locator;
    readonly hasEnoughTimeCheckbox: Locator;
    readonly isInPrivateCheckbox: Locator;
    readonly wroteSeedProperlyCheckbox: Locator;
    readonly madeNoDigitalCopyCheckbox: Locator;
    readonly willHideSeedCheckbox: Locator;
    readonly closeButton: Locator;

    constructor(
        private page: Page,
        private devicePrompt: DevicePrompt,
    ) {
        this.startButton = page.getByTestId('@backup/start-button');
        this.understandWhatSeedIsCheckbox = page.getByTestId(
            '@backup/check-item/understands-what-seed-is',
        );
        this.hasEnoughTimeCheckbox = page.getByTestId('@backup/check-item/has-enough-time');
        this.isInPrivateCheckbox = page.getByTestId('@backup/check-item/is-in-private');
        this.wroteSeedProperlyCheckbox = page.getByTestId('@backup/check-item/wrote-seed-properly');
        this.madeNoDigitalCopyCheckbox = page.getByTestId(
            '@backup/check-item/made-no-digital-copy',
        );
        this.willHideSeedCheckbox = page.getByTestId('@backup/check-item/will-hide-seed');
        this.closeButton = page.getByTestId('@backup/close-button');
    }

    @step()
    async passThroughShamirBackup(shares: number, threshold: number) {
        // Backup button should be disabled until all checkboxes are checked
        await expect(this.startButton).toBeDisabled();

        await this.wroteSeedProperlyCheckbox.click();
        await this.madeNoDigitalCopyCheckbox.click();
        await this.willHideSeedCheckbox.click();

        // Create Shamir backup on device
        await this.startButton.click();
        await this.devicePrompt.confirmOnDevicePromptIsShown();

        // Adding delay to mitigate race condition; avoids hitting the homescreen
        await this.page.waitForTimeout(1000);
        await TrezorUserEnvLinkProxy.readAndConfirmShamirMnemonicEmu({ shares, threshold });

        await this.closeButton.click();
    }
}
