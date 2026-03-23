import { BackupType } from '@suite-common/suite-types';
import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import {
    getModelFromEnv,
    isElementVisible,
    scrollUntilVisible,
    wait,
    waitForVisible,
} from '../support/utils';

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

    async waitForDeviceCompromisedModal() {
        await waitForVisible(by.id('@screen/DeviceCompromisedModal'));
    }

    async dismissTheUninitializedDeviceLanding() {
        await element(by.id('@deviceOnboarding/UninitializedDeviceLandingScreen/confirmBtn')).tap();
    }

    async skipFirmwareUpdate() {
        const skipFirmwareUpdateButton = element(by.id('@firmware/skip-button'));
        await waitForVisible(skipFirmwareUpdateButton);
        await skipFirmwareUpdateButton.tap();
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

    async proceedToCreateOrRecoverCrossroads() {
        await this.waitForUninitializedDeviceLanding();
        await this.dismissTheUninitializedDeviceLanding();
        // During our release process, the TrezorUserEnv might not have the latest firmware version.
        // In such cases, the firmware update screen appears here.
        // We want to skip the update in e2e tests as it is not supported.
        const isFirmwareUpdateScreenPresent = await isElementVisible(
            by.id('@device-firmware/update-button'),
        );
        if (isFirmwareUpdateScreenPresent) {
            await this.skipFirmwareUpdate();
            console.warn(
                'SKIPPING FIRMWARE UPDATE: Firmware update was displayed, make sure it was only due to TrezorUserEnv not having latest firmware version.',
            );
        }

        await TrezorUserEnvLink.pressYes();

        if (getModelFromEnv() !== Model.T3W1) {
            // skip device authenticity check on T3W1 because we are using 2-main FW
            await this.waitForDeviceAuthenticitySuccess();
            await this.dismissDeviceAuthenticitySuccess();
        }

        await TrezorUserEnvLink.pressYes();

        await this.waitForCreateOrRecoverCrossroadsScreen();
    }

    async startCreatingWallet() {
        await this.selectCreateWalletOption();
        await this.waitForCreateWalletLoadingScreen();
        await this.waitForWalletBackupTutorialScreen();
        await this.gotToNextWalletBackupTutorialStep(1);
        await this.gotToNextWalletBackupTutorialStep(2);
        await this.gotToNextWalletBackupTutorialStep(3);
        await this.gotToNextWalletBackupTutorialStep(4);
        await this.validateSelectedBackupType('shamir-single');
        await this.gotToNextWalletBackupTutorialStep(5);
        await wait(5000); // wait for entering animation to finish

        await this.pressHoldToConfirmButton();
        await this.waitForWalletCreationScreen();

        // at this point, wallet creation + entropy check on device has begun
        await TrezorUserEnvLink.swipeEmu('up');
        // backup flow confirmation, so we reject it early, so resetDevice call is resolved
        await TrezorUserEnvLink.pressNo();
    }
}

export const onDeviceOnboarding = new DeviceOnboardingActions();
