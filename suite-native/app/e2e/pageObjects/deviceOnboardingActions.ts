import { BackupType } from '@suite-common/suite-types';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { scrollUntilVisible, waitForVisible } from '../support/utils';

class DeviceOnboardingActions {
    async selectCreateWalletOption() {
        const buttonId = '@deviceOnboarding/CreateOrRecoverCrossroadsScreen/createWalletBtn';
        await waitForVisible(by.id(buttonId));
        await element(by.id(buttonId)).tap();
    }

    async selectRecoverWalletOption() {
        const buttonId = '@deviceOnboarding/CreateOrRecoverCrossroadsScreen/recoverWalletBtn';
        await waitForVisible(by.id(buttonId));
        await element(by.id(buttonId)).tap();
    }

    async confirmRecoveryInstructions() {
        const buttonId = '@deviceOnboarding/RecoveryInstructionsScreen/continueButton';
        await waitForVisible(by.id(buttonId));
        await element(by.id(buttonId)).tap();
    }

    async waitForCreateOrRecoverCrossroadsScreen() {
        await waitForVisible(by.id('@screen/CreateOrRecoverCrossroads'));
    }

    async waitForCreateWalletLoadingScreen() {
        await waitForVisible(by.id('@screen/CreateWalletLoading'));
    }

    async waitForWalletBackupTutorialScreen() {
        await waitForVisible(by.id('@screen/WalletBackupTutorial'));
    }

    async waitForWalletCreationScreen() {
        await waitForVisible(by.id('@screen/WalletCreation'));
    }

    async gotToNextWalletBackupTutorialStep(step: number) {
        const buttonId = `@swipeableWalkthroughStep/walletBackupTutorialStep${step}/nextButton`;
        await waitForVisible(by.id(buttonId));
        await element(by.id(buttonId)).tap();
    }

    async goToNextWalletBackupRecapStep(step: number) {
        const buttonId = `@swipeableWalkthroughStep/walletBackupRecapStep${step}/nextButton`;
        await waitForVisible(by.id(buttonId));
        await element(by.id(buttonId)).tap();
    }

    async goToNextWalletRecoveryRecapStep(step: number) {
        const buttonId = `@swipeableWalkthroughStep/walletRecoveryRecapStep${step}/nextButton`;
        await waitForVisible(by.id(buttonId));
        await element(by.id(buttonId)).tap();
    }

    async waitForWalletBackupRecapScreen() {
        await waitForVisible(by.id('@screen/WalletBackupRecap'));
    }

    async waitForWalletRecoveryRecapScreen() {
        await waitForVisible(by.id('@screen/WalletRecoveryRecap'));
    }

    async openWalletBackupTypeMenu() {
        const buttonId = '@deviceOnboarding/WalletBackupTutorialStep5/moreOptionsButton';
        await waitForVisible(by.id(buttonId));
        await element(by.id(buttonId)).tap();
    }

    async validateSelectedBackupType(selectedType: BackupType) {
        await waitForVisible(
            by.id(`onboarding/WalletBackupTutorialStep5/selectedType=${selectedType}`),
        );
    }

    async scrollToWalletBackupTypeAndSelect(selectedType: BackupType) {
        const selectedTypeElement = element(
            by.id(
                `@deviceOnboarding/WalletBackupTutorialStep5/WalletBackupCard/selectedType=${selectedType}`,
            ),
        );

        await scrollUntilVisible(selectedTypeElement, '@bottom-sheet/scroll-view');
        await selectedTypeElement.tap();
    }

    async pressHoldToConfirmButton() {
        const buttonId = '@holdToConfirmButton';
        await waitForVisible(by.id(buttonId));
        const holdToConfirmButton = element(by.id(buttonId));
        await holdToConfirmButton.longPress(3000);
    }

    async waitForUninitializedDeviceLanding() {
        await waitForVisible(by.id('@screen/UninitializedDeviceLanding'));
    }

    async waitForDeviceAuthenticitySuccess() {
        await waitForVisible(by.id('@screen/DeviceAuthenticitySuccess'));
    }

    async dismissDeviceAuthenticitySuccess() {
        const buttonId = '@device-authenticity/continue-button';
        await waitForVisible(by.id(buttonId));
        await element(by.id(buttonId)).tap();
    }

    async dismissTheUninitializedDeviceLanding() {
        await element(by.id('@deviceOnboarding/UninitializedDeviceLandingScreen/confirmBtn')).tap();
    }

    async skipFirmwareUpdate() {
        const testId = '@firmware/skip-button';
        try {
            await waitForVisible(by.id(testId));
            await element(by.id(testId)).tap();
        } catch {
            console.warn(
                'SKIPPING FIRMWARE UPDATE: Firmware update was not displayed, it is already latest version.',
            );
        }
    }

    async enterTHPPairingCode() {
        await waitForVisible(by.id('@screen/ThpCodeEntry'));
        const screenContent = await TrezorUserEnvLink.getScreenContent();
        const screenContentBody = screenContent.body as string;
        const code = screenContentBody.match(/(\d\s*){6}$/)?.[0].replace(/\s+/g, '');
        if (!code) {
            throw new Error(`Screen content did not contain pairing code\n${screenContentBody}`);
        }
        await element(by.id('@thpSecurityCode/Input')).replaceText(code);
    }
}

export const onDeviceOnboarding = new DeviceOnboardingActions();
