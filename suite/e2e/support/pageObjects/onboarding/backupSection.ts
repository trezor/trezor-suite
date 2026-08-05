import { Locator, Page, expect } from '@playwright/test';

import { step } from '../../common';
import { DeviceFixture } from '../../device';
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
    readonly noDeviceModal: Locator;
    readonly errorBanner: Locator;
    readonly errorBannerContinueButton: Locator;
    readonly failedBackupSetting: Locator;
    readonly backupFailedSettingLink: Locator;
    readonly backupFailedSettingButton: Locator;
    readonly skipBackupButton: Locator;
    readonly createBackupButton: Locator;
    readonly continueButton: Locator;

    constructor(
        private readonly page: Page,
        private readonly device: DeviceFixture,
        private readonly devicePrompt: DevicePrompt,
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
        this.noDeviceModal = page.getByTestId('@backup/no-device');
        this.errorBanner = page.getByTestId('@notification/failed-backup');
        this.errorBannerContinueButton = page.getByTestId(
            '@notification/failed-backup/continue-button',
        );
        this.failedBackupSetting = page.getByTestId('@device-settings/backup-failed');
        this.backupFailedSettingLink = page.getByTestId(
            '@device-settings/backup-failed/learn-more-button',
        );
        this.backupFailedSettingButton = page.getByTestId(
            '@device-settings/backup-failed/disabled-button',
        );
        this.skipBackupButton = this.page.getByTestId('@onboarding/skip-backup');
        this.createBackupButton = this.page.getByTestId('@onboarding/create-backup-button');
        this.continueButton = this.page.getByTestId('@onboarding/continue-button');
    }

    @step()
    async passThroughShamirBackup({
        shares = 1,
        threshold = 1,
        deviceConfirmations,
    }: {
        shares?: number;
        threshold?: number;
        deviceConfirmations: number;
    }) {
        await expect(this.createBackupButton).toBeDisabled();

        await this.wroteSeedProperlyCheckbox.click();
        await this.madeNoDigitalCopyCheckbox.click();
        await this.willHideSeedCheckbox.click();

        await this.createBackupButton.click();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        for (let i = 0; i < deviceConfirmations; i++) {
            await this.page.waitForTimeout(1000);
            await this.device.pressYes();
        }

        await this.page.waitForTimeout(1000);

        if (shares > 1) {
            await this.device.readAndConfirmAtomicShamirMnemonic({ shares, threshold });
        } else {
            await this.device.readAndConfirmSingleShamirMnemonic();
        }

        await this.continueButton.click();
    }

    @step()
    async passThroughBip39Backup({ deviceConfirmations }: { deviceConfirmations: number }) {
        await expect(this.createBackupButton).toBeDisabled();

        await this.wroteSeedProperlyCheckbox.click();
        await this.madeNoDigitalCopyCheckbox.click();
        await this.willHideSeedCheckbox.click();

        await this.createBackupButton.click();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        for (let i = 0; i < deviceConfirmations; i++) {
            await this.page.waitForTimeout(1000);
            await this.device.pressYes();
        }

        // For BIP39, manually confirm all seed words on device (48 presses for 12 words on T1B1)
        await this.page.waitForTimeout(1000);
        for (let i = 0; i < 48; i++) {
            await this.device.pressYes();
        }

        await this.continueButton.click();
    }
}
