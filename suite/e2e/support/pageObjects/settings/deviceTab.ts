import { Locator, Page, expect } from '@playwright/test';

import { step } from '../../common';

export class DeviceTab {
    readonly createMultiShareBackupButton: Locator;
    readonly multiShareBackupGotItButton: Locator;
    private readonly firstInfoSubmitButton: Locator;
    private readonly secondInfoSubmitButton: Locator;
    readonly customFirmwareModalButton: Locator;
    readonly firmwareInstallButton: Locator;
    readonly firmwareInputArea: Locator;
    readonly firmwareConfirmSeedCheckbox: Locator;
    readonly firmwareConfirmSeedButton: Locator;
    readonly firmwareReconnectDevice: Locator;
    readonly autoconnectSwitch: Locator;

    // Forget device flow
    readonly forgetDeviceButton: Locator;
    readonly forgetConfirmButton: Locator;
    readonly forgetConfirmationModal: Locator;
    readonly forgetCleanupModal: Locator;
    readonly forgetUnplugModal: Locator;
    readonly forgetBtRemovalModal: Locator;
    readonly forgetOsRemovalConfirmButton: Locator;
    readonly forgetTrezorRemovalConfirmButton: Locator;
    readonly forgetBtRemovalGotItButton: Locator;

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
        this.customFirmwareModalButton = page.getByTestId(
            '@settings/device/custom-firmware-modal-button',
        );
        this.firmwareInstallButton = page.getByTestId('@firmware/install-button');
        this.firmwareInputArea = page.getByTestId('@firmware/input-area');
        this.firmwareConfirmSeedCheckbox = page.getByTestId('@firmware/confirm-seed-checkbox');
        this.firmwareConfirmSeedButton = page.getByTestId('@firmware/confirm-seed-button');
        this.firmwareReconnectDevice = page.getByTestId('@firmware/reconnect-device');
        this.autoconnectSwitch = page.getByTestId('@settings/device/thp-autoconnect');

        // Forget device flow
        this.forgetDeviceButton = page.getByTestId('@settings/device/forget-button');
        this.forgetConfirmButton = page.getByTestId('@settings/device/forget-confirm');
        this.forgetConfirmationModal = page.getByTestId(
            '@settings/device/forget-confirmation-modal',
        );
        this.forgetCleanupModal = page.getByTestId('@settings/device/forget-cleanup-modal');
        this.forgetUnplugModal = page.getByTestId('@settings/device/forget-unplug-modal');
        this.forgetBtRemovalModal = page.getByTestId('@settings/device/forget-bt-removal-modal');
        this.forgetOsRemovalConfirmButton = page.getByTestId(
            '@settings/device/forget-os-removal-confirm',
        );
        this.forgetTrezorRemovalConfirmButton = page.getByTestId(
            '@settings/device/forget-trezor-removal-confirm',
        );
        this.forgetBtRemovalGotItButton = page.getByTestId(
            '@settings/device/forget-bt-removal-got-it',
        );
    }

    @step()
    async proceedMultiShareBackupModal(): Promise<void> {
        await this.page.getByTestId('@multi-share-backup/checkbox/1').click();
        await this.page.getByTestId('@multi-share-backup/checkbox/2').click();
        await this.firstInfoSubmitButton.click();
        await this.secondInfoSubmitButton.click();
    }

    @step()
    async openCustomFirmwareModal() {
        await this.customFirmwareModalButton.click();
        await expect(this.firmwareInstallButton).toBeDisabled();
    }

    @step()
    async selectCustomFirmware(filePath: string) {
        const fileChooserPromise = this.page.waitForEvent('filechooser');
        await this.firmwareInputArea.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(filePath);
    }

    @step()
    async completeCustomFirmwareInstallation() {
        await this.firmwareInstallButton.click();
        await this.firmwareConfirmSeedCheckbox.click();
        await this.firmwareConfirmSeedButton.click();
    }
}
