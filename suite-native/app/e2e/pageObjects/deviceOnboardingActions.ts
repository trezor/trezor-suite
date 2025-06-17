import { WalletBackupType } from '@suite-native/device';

import { scrollUntilVisible, waitForElementByIdToBeVisible } from '../utils';

class DeviceOnboardingActions {
    async selectCreateWalletOption() {
        const buttonId = '@deviceOnboarding/CreateOrRecoverCrossroadsScreen/createWalletBtn';
        await waitForElementByIdToBeVisible(buttonId);
        await element(by.id(buttonId)).tap();
    }

    async selectRecoverWalletOption() {
        const buttonId = '@deviceOnboarding/CreateOrRecoverCrossroadsScreen/recoverWalletBtn';
        await waitForElementByIdToBeVisible(buttonId);
        await element(by.id(buttonId)).tap();
    }

    async confirmRecoveryInstructions() {
        const buttonId = '@deviceOnboarding/RecoveryInstructionsScreen/continueButton';
        await waitForElementByIdToBeVisible(buttonId);
        await element(by.id(buttonId)).tap();
    }

    async waitForCreateOrRecoverCrossroadsScreen() {
        await waitForElementByIdToBeVisible('@screen/CreateOrRecoverCrossroads');
    }

    async waitForCreateWalletLoadingScreen() {
        await waitForElementByIdToBeVisible('@screen/CreateWalletLoading');
    }

    async waitForWalletBackupTutorialScreen() {
        await waitForElementByIdToBeVisible('@screen/WalletBackupTutorial');
    }

    async waitForWalletCreationScreen() {
        await waitForElementByIdToBeVisible('@screen/WalletCreation');
    }

    async gotToNextWalletBackupTutorialStep(step: number) {
        const buttonId = `@deviceOnboarding/walletBackupTutorialStep${step}/nextButton`;
        await waitForElementByIdToBeVisible(buttonId);
        await element(by.id(buttonId)).tap();
    }

    async goToNextWalletBackupRecapStep(step: number) {
        const buttonId = `@deviceOnboarding/walletBackupRecapStep${step}/nextButton`;
        await waitForElementByIdToBeVisible(buttonId);
        await element(by.id(buttonId)).tap();
    }

    async goToNextWalletRecoveryRecapStep(step: number) {
        const buttonId = `@deviceOnboarding/walletRecoveryRecapStep${step}/nextButton`;
        await waitForElementByIdToBeVisible(buttonId);
        await element(by.id(buttonId)).tap();
    }

    async waitForWalletBackupRecapScreen() {
        await waitForElementByIdToBeVisible('@screen/WalletBackupRecap');
    }

    async waitForWalletRecoveryRecapScreen() {
        await waitForElementByIdToBeVisible('@screen/WalletRecoveryRecap');
    }

    async openWalletBackupTypeMenu() {
        const buttonId = '@deviceOnboarding/WalletBackupTutorialStep5/moreOptionsButton';
        await waitForElementByIdToBeVisible(buttonId);
        await element(by.id(buttonId)).tap();
    }

    async validateSelectedBackupType(selectedType: WalletBackupType) {
        await waitForElementByIdToBeVisible(
            `onboarding/WalletBackupTutorialStep5/selectedType=${selectedType}`,
        );
    }

    async scrollToWalletBackupTypeAndSelect(selectedType: WalletBackupType) {
        const selectedTypeElement = element(
            by.id(
                `@deviceOnboarding/WalletBackupTutorialStep5/WalletBackupCard/selectedType=${selectedType}`,
            ),
        );

        await scrollUntilVisible(selectedTypeElement, '@bottom-sheet/scroll-view');
        await selectedTypeElement.tap();
    }

    async pressHoldToConfirmButton() {
        const buttonId = '@deviceOnboarding/HoldToConfirmButton';
        await waitForElementByIdToBeVisible(buttonId);
        const holdToConfirmButton = element(by.id(buttonId));
        await holdToConfirmButton.longPress(3000);
    }

    async waitForUninitializedDeviceLanding() {
        await waitForElementByIdToBeVisible('@screen/UninitializedDeviceLanding');
    }

    async waitForDeviceAuthenticitySuccess() {
        await waitForElementByIdToBeVisible('@screen/DeviceAuthenticitySuccess');
    }

    async dismissDeviceAuthenticitySuccess() {
        const buttonId = '@device-authenticity/continue-button';
        await waitForElementByIdToBeVisible(buttonId);
        await element(by.id(buttonId)).tap();
    }

    async dismissTheUninitializedDeviceLanding() {
        await element(by.id('@deviceOnboarding/UninitializedDeviceLandingScreen/confirmBtn')).tap();
    }

    async skipFirmwareUpdate() {
        const testId = '@firmware/skip-button';
        try {
            await waitForElementByIdToBeVisible(testId, 5000);
            await element(by.id(testId)).tap();
        } catch {
            console.warn(
                'SKIPPING FIRMWARE UPDATE: Firmware update was not displayed, it is already latest version.',
            );
        }
    }
}

export const onDeviceOnboarding = new DeviceOnboardingActions();
