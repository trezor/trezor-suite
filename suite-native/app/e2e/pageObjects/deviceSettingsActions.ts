import { MNEMONICS, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { scrollUntilVisible, wait, waitForVisible } from '../support/utils';

const insertSeed = async (seed: string = MNEMONICS.mnemonic_immune) => {
    const seedWords = seed.split(' ');
    for (const word of seedWords) {
        await TrezorUserEnvLink.inputEmu(word);
    }
};

export const redirectToDeviceAuthenticityScreenButton = element(
    by.id('@device-authenticity/redirectToDeviceAuthenticityScreen'),
);

class DeviceSettingsActions {
    async waitForSettingsScreen() {
        await waitForVisible(by.id('@screen/DeviceSettings'));
    }

    async waitForHomeScreenAndUninitializedTitle() {
        await waitForVisible(by.id('@screen/Home'));
        await waitForVisible(by.id('@homescreen/uninitializedConnectedDeviceText'));
    }

    async waitForPinProtectionScreen() {
        await waitForVisible(by.id('@screen/DevicePinProtection'));
    }

    async waitForWipeDeviceContinueOnTrezor() {
        await waitForVisible(by.id('@screen/ContinueOnTrezor'));
    }

    async waitForDeviceAuthenticityScreen() {
        await waitForVisible(by.id('@screen/DeviceAuthenticity'));
    }

    async redirectToPinProtectionScreen() {
        const redirectToPinScreenButton = element(
            by.id('@device-pin-protection/redirectToPinScreen'),
        );
        await waitForVisible(redirectToPinScreenButton);
        await redirectToPinScreenButton.tap();
    }

    async redirectToDeviceAuthenticityScreen() {
        await scrollUntilVisible(redirectToDeviceAuthenticityScreenButton);
        await redirectToDeviceAuthenticityScreenButton.tap();
    }

    async tapEnablePinProtectionButton() {
        await this.waitForPinProtectionScreen();
        const enablePinProtectionButton = element(by.id('@device-pin-protection/enable-button'));
        await waitForVisible(enablePinProtectionButton);

        await enablePinProtectionButton.tap();
    }

    async tapChangePinProtectionButton() {
        const changePinProtectionButton = element(by.id('@device-pin-protection/change-button'));

        await waitForVisible(changePinProtectionButton);
        await changePinProtectionButton.tap();
    }

    async tapDisablePinProtectionButton() {
        const disablePinProtectionButton = element(by.id('@device-pin-protection/disable-button'));

        await waitForVisible(disablePinProtectionButton);
        await disablePinProtectionButton.tap();
    }

    async tapChangeDeviceNameButton() {
        const changeDeviceNameButton = element(by.id('@device-name/change-button'));

        await waitForVisible(changeDeviceNameButton);
        await changeDeviceNameButton.tap();
    }

    async tapWipeDevice() {
        const wipeDeviceButton = element(by.id('@wipeDevice/redirectToWipeDeviceScreen'));
        await scrollUntilVisible(wipeDeviceButton);
        await wipeDeviceButton.tap();
    }

    async tapDeviceCheckBackupButton() {
        const backupAndPassphrase = element(
            by.id('@device-backupAndPassphrase/redirectToBackupAndPassphraseScreen'),
        );

        await scrollUntilVisible(backupAndPassphrase);
        await backupAndPassphrase.tap();

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
        await waitForVisible(updateFirmwareButton);
        await updateFirmwareButton.tap();
    }

    async tapCheckBackupButtonFromFirmwareUpdate() {
        const checkBackupButton = element(by.id('@device-firmware/sheet/check-backup'));
        await waitForVisible(checkBackupButton);
        await checkBackupButton.tap();
    }

    async submitNewDeviceName(value: string) {
        const changeDeviceNameInput = element(by.id('@device-name/input'));
        const changeDeviceNameSubmitButton = element(by.id('@device-name/submit-button'));

        await waitForVisible(changeDeviceNameInput);
        await changeDeviceNameInput.tap();
        await changeDeviceNameInput.replaceText(value);
        await changeDeviceNameSubmitButton.tap();
    }

    async tapCheckAuthenticityButton() {
        const checkDeviceAuthenticityButton = element(by.id('@device-authenticity/check-button'));
        await waitForVisible(checkDeviceAuthenticityButton);
        await checkDeviceAuthenticityButton.tap();
    }

    async confirmStepperItems(count: number) {
        const confirmButton = element(by.id('@cardStepper/confirm-button'));

        for (let i = 0; i < count; i++) {
            await waitForVisible(confirmButton);
            await confirmButton.tap();
        }
    }

    async goToNextDeviceCheckBackupTutorialStep(step: number) {
        const buttonId = `@swipeableWalkthroughStep/checkBackupTutorialStep${step}/nextButton`;
        await waitForVisible(by.id(buttonId));
        await element(by.id(buttonId)).tap();
    }

    async tapDeviceCheckBackupContinueButton() {
        const continueButton = element(by.id('@device-check-backup/continue-button'));
        await waitForVisible(continueButton);
        await continueButton.tap();
    }

    async passCheckBackupFlow() {
        await this.goToNextDeviceCheckBackupTutorialStep(1);
        await this.tapDeviceCheckBackupContinueButton();

        await TrezorUserEnvLink.pressYes();
        await wait(500); // Firmware 2.9.4 brought instability in firmware/emu interaction, this will be discussed with firmware team
        await TrezorUserEnvLink.selectNumOfWordsEmu(12);
        await wait(500); // short timeout is needed to avoid calling `.pressYes()` before the `.selectNumOfWordsEmu()` is registered by emulator
        await TrezorUserEnvLink.pressYes();
        await wait(500); // Firmware 2.9.4 brought instability in firmware/emu interaction, this will be discussed with firmware team
        await insertSeed();
        await wait(500); // Firmware 2.9.4 brought instability in firmware/emu interaction, this will be discussed with firmware team
        await TrezorUserEnvLink.pressYes();

        await waitForVisible(by.text('Your backup is valid'));
    }
}

export const onDeviceSettings = new DeviceSettingsActions();
