import { MNEMONICS, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { scrollUntilVisible, waitForElementByIdToBeVisible } from '../utils';

const insertAllSeed = async () => {
    for (let i = 0; i < MNEMONICS.mnemonic_all.length; i++) {
        await TrezorUserEnvLink.inputEmu('all');
    }
};

export const redirectToDeviceAuthenticityScreenButton = element(
    by.id('@device-authenticity/redirectToDeviceAuthenticityScreen'),
);

class DeviceSettingsActions {
    async waitForSettingsScreen() {
        await waitFor(element(by.id('@screen/DeviceSettings')))
            .toBeVisible()
            .withTimeout(10000);
    }

    async waitForHomescreenAndUninitializedTitle() {
        await waitFor(element(by.id('@screen/Home')))
            .toBeVisible()
            .withTimeout(10000);
        await waitFor(element(by.id('@homescreen/uninitializedConnectedDeviceText')))
            .toBeVisible()
            .withTimeout(10000);
    }

    async waitForPinProtectionScreen() {
        await waitFor(element(by.id('@screen/PinProtection')))
            .toBeVisible()
            .withTimeout(10000);
    }

    async waitForWipeDeviceContinueOnTrezor() {
        await waitFor(element(by.id('@screen/ContinueOnTrezor')))
            .toBeVisible()
            .withTimeout(10000);
    }

    async waitForDeviceAuthenticityScreen() {
        await waitFor(element(by.id('@screen/DeviceAuthenticity')))
            .toBeVisible()
            .withTimeout(10000);
    }

    async redirectToPinProtectionScreen() {
        const redirectToPinScreenButton = element(
            by.id('@device-pin-protection/redirectToPinScreen'),
        );
        await waitFor(redirectToPinScreenButton).toBeVisible().withTimeout(10000);
        await redirectToPinScreenButton.tap();
    }

    async redirectToDeviceAuthenticityScreen() {
        await scrollUntilVisible(redirectToDeviceAuthenticityScreenButton);
        await redirectToDeviceAuthenticityScreenButton.tap();
    }

    async tapEnablePinProtectionButton() {
        await waitFor(element(by.id('@screen/PinProtection')))
            .toBeVisible()
            .withTimeout(10000);

        const enablePinProtectionButton = element(by.id('@device-pin-protection/enable-button'));
        await waitFor(enablePinProtectionButton).toBeVisible().withTimeout(10000);

        await enablePinProtectionButton.tap();
    }

    async tapChangePinProtectionButton() {
        const changePinProtectionButton = element(by.id('@device-pin-protection/change-button'));

        await waitFor(changePinProtectionButton).toBeVisible().withTimeout(10000);
        await changePinProtectionButton.tap();
    }

    async tapDisablePinProtectionButton() {
        const disablePinProtectionButton = element(by.id('@device-pin-protection/disable-button'));

        await waitFor(disablePinProtectionButton).toBeVisible().withTimeout(10000);
        await disablePinProtectionButton.tap();
    }

    async tapChangeDeviceNameButton() {
        const changeDeviceNameButton = element(by.id('@device-name/change-button'));

        await waitFor(changeDeviceNameButton).toBeVisible().withTimeout(10000);
        await changeDeviceNameButton.tap();
    }

    async tapWipeDevice() {
        const wipeDeviceButton = element(by.id('@wipeDevice/redirectToWipeDeviceScreen'));
        await scrollUntilVisible(wipeDeviceButton);
        await wipeDeviceButton.tap();
    }

    async tapDeviceCheckBackupButton() {
        const deviceCheckBackup = element(
            by.id('@device-check-backup/redirectToDeviceCheckBackupScreen'),
        );

        await scrollUntilVisible(deviceCheckBackup);
        await deviceCheckBackup.tap();
    }

    async tapUpdateFirmwareButton() {
        const deviceFirmware = element(by.id('@device-firmware/redirectToFirmwareUpdateScreen'));

        await scrollUntilVisible(deviceFirmware);
        await deviceFirmware.tap();
    }

    async tapUpdateFirmwareBottomSheet() {
        const updateFirmwareButton = element(by.id('@device-firmware/update-button'));
        await waitFor(updateFirmwareButton).toBeVisible().withTimeout(10000);
        await updateFirmwareButton.tap();
    }

    async tapCheckBackupButtonFromFirmwareUpdate() {
        const checkBackupButton = element(by.id('@device-firmware/sheet/check-backup'));
        await waitFor(checkBackupButton).toBeVisible().withTimeout(10000);
        await checkBackupButton.tap();
    }

    async submitNewDeviceName(value: string) {
        const changeDeviceNameInput = element(by.id('@device-name/input'));
        const changeDeviceNameSubmitButton = element(by.id('@device-name/submit-button'));

        await waitFor(changeDeviceNameInput).toBeVisible().withTimeout(10000);
        await changeDeviceNameInput.tap();
        await changeDeviceNameInput.replaceText(value);
        await changeDeviceNameSubmitButton.tap();
    }

    async tapCheckAuthenticityButton() {
        const checkDeviceAuthenticityButton = element(by.id('@device-authenticity/check-button'));
        await waitFor(checkDeviceAuthenticityButton).toBeVisible().withTimeout(5_000);
        await checkDeviceAuthenticityButton.tap();
    }

    async confirmStepperItems(items: number) {
        const confirmButton = element(by.id('@cardStepper/confirm-button'));

        for (let i = 0; i < items; i++) {
            await waitFor(confirmButton).toBeVisible().withTimeout(10000);
            await confirmButton.tap();
        }
    }

    async goToNextDeviceCheckBackupTutorialStep(step: number) {
        const buttonId = `@swipeableWalkthroughStep/checkBackupTutorialStep${step}/nextButton`;
        await waitForElementByIdToBeVisible(buttonId);
        await element(by.id(buttonId)).tap();
    }

    async tapDeviceCheckBackupContinueButton() {
        const continueButton = element(by.id('@device-check-backup/continue-button'));
        await waitFor(continueButton).toBeVisible().withTimeout(10000);
        await continueButton.tap();
    }

    async passCheckBackupFlow() {
        await this.goToNextDeviceCheckBackupTutorialStep(1);
        await this.tapDeviceCheckBackupContinueButton();

        await TrezorUserEnvLink.pressYes();
        await TrezorUserEnvLink.selectNumOfWordsEmu(12);
        await TrezorUserEnvLink.pressYes();
        await insertAllSeed();
    }
}

export const onDeviceSettings = new DeviceSettingsActions();
