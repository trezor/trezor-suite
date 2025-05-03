import { WalletBackupType } from '@suite-native/device';

import { scrollUntilVisible, wait, waitForElementByIdToBeVisible } from '../utils';

class DeviceOnboardingActions {
    async selectCreateWalletOption() {
        await waitForElementByIdToBeVisible(
            '@deviceOnboarding/CreateOrRecoverCrossroadsScreen/createWalletBtn',
        );
        await element(
            by.id('@deviceOnboarding/CreateOrRecoverCrossroadsScreen/createWalletBtn'),
        ).tap();
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
        await waitForElementByIdToBeVisible(
            `@deviceOnboarding/walletBackupTutorialStep${step}/nextButton`,
        );
        await element(by.id(`@deviceOnboarding/walletBackupTutorialStep${step}/nextButton`)).tap();
    }

    async goToNextWalletBackupRecapStep(step: number) {
        await waitForElementByIdToBeVisible(
            `@deviceOnboarding/walletBackupRecapStep${step}/nextButton`,
        );
        await element(by.id(`@deviceOnboarding/walletBackupRecapStep${step}/nextButton`)).tap();
    }

    async waitForWalletBackupRecapScreen() {
        await waitForElementByIdToBeVisible('@screen/WalletBackupRecap');
    }

    async openWalletBackupTypeMenu() {
        await waitForElementByIdToBeVisible(
            '@deviceOnboarding/WalletBackupTutorialStep5/moreOptionsButton',
        );
        await element(by.id('@deviceOnboarding/WalletBackupTutorialStep5/moreOptionsButton')).tap();
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
        await wait(5000);
        const holdToConfirmButton = element(by.id('@deviceOnboarding/HoldToConfirmButton'));
        await waitForElementByIdToBeVisible('@deviceOnboarding/HoldToConfirmButton');
        await holdToConfirmButton.longPress(3000);
    }

    async waitForUninitializedDeviceLanding() {
        await waitForElementByIdToBeVisible('@screen/UninitializedDeviceLanding');
    }

    async waitForDeviceAuthenticitySuccess() {
        await waitForElementByIdToBeVisible('@screen/DeviceAuthenticitySuccess');
    }

    async dismissDeviceAuthenticitySuccess() {
        await waitForElementByIdToBeVisible('@device-authenticity/continue-button');
        await element(by.id('@device-authenticity/continue-button')).tap();
    }

    async dismissTheUninitializedDeviceLanding() {
        await element(by.id('@deviceOnboarding/UninitializedDeviceLandingScreen/confirmBtn')).tap();
    }

    async skipFirmwareUpdate() {
        const testId = '@firmware/skip-button';
        await waitForElementByIdToBeVisible(testId, 20000);
        await element(by.id(testId)).tap();
    }
}

export const onDeviceOnboarding = new DeviceOnboardingActions();
