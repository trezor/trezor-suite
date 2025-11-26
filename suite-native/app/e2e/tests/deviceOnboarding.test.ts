import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { btcCoinEnabled } from '../fixtures/btcCoinEnabled';
import { deviceChecksDisabledState } from '../fixtures/deviceChecksDisabledState';
import { deviceChecksEnabledState } from '../fixtures/deviceChecksEnabledState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onHome } from '../pageObjects/homeActions';
import {
    getModelFromEnv,
    openApp,
    preparePreloadedReduxState,
    prepareTrezorEmulator,
} from '../support/setup';
import { isElementVisible, wait } from '../support/utils';

const proceedToCreateOrRecoverCrossroads = async () => {
    await onDeviceOnboarding.waitForUninitializedDeviceLanding();
    await onDeviceOnboarding.dismissTheUninitializedDeviceLanding();
    // During our release process, the TrezorUserEnv might not have the latest firmware version.
    // In such cases, the firmware update screen appears here.
    // We want to skip the update in e2e tests as it is not supported.
    const isFirmwareUpdateScreenPresent = await isElementVisible(
        by.id('@device-firmware/update-button'),
    );
    if (isFirmwareUpdateScreenPresent) {
        await onDeviceOnboarding.skipFirmwareUpdate();
        console.warn(
            'SKIPPING FIRMWARE UPDATE: Firmware update was displayed, make sure it was only due to TrezorUserEnv not having latest firmware version.',
        );
    }

    await TrezorUserEnvLink.pressYes();

    if (getModelFromEnv() !== 'T3W1') {
        // skip device authenticity check on T3W1 because we are using 2-main FW
        await onDeviceOnboarding.waitForDeviceAuthenticitySuccess();
        await onDeviceOnboarding.dismissDeviceAuthenticitySuccess();
    }

    await TrezorUserEnvLink.pressYes();

    await onDeviceOnboarding.waitForCreateOrRecoverCrossroadsScreen();
};

const finishOnboardingFlow = async () => {
    // Create Pin
    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.inputEmu('123');
    await TrezorUserEnvLink.inputEmu('123');
    await TrezorUserEnvLink.pressYes();

    await onHome.waitForScreen();
};

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    getModelFromEnv() === 'T3W1' ? deviceChecksDisabledState : deviceChecksEnabledState, // skip device checks on T3W1 because we are using 2-main FW
    btcCoinEnabled,
);

conditionalDescribe(device.getPlatform() === 'android', 'Device onboarding [@fixT3W1]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await prepareTrezorEmulator({ seed: '' });
        await proceedToCreateOrRecoverCrossroads();
    });

    it('Create Wallet', async () => {
        await onDeviceOnboarding.selectCreateWalletOption();

        await onDeviceOnboarding.waitForCreateWalletLoadingScreen();

        // Create Wallet Backup
        await onDeviceOnboarding.waitForWalletBackupTutorialScreen();

        await onDeviceOnboarding.gotToNextWalletBackupTutorialStep(1);
        await onDeviceOnboarding.gotToNextWalletBackupTutorialStep(2);
        await onDeviceOnboarding.gotToNextWalletBackupTutorialStep(3);
        await onDeviceOnboarding.gotToNextWalletBackupTutorialStep(4);
        await onDeviceOnboarding.validateSelectedBackupType('shamir-single');
        await onDeviceOnboarding.gotToNextWalletBackupTutorialStep(5);
        await wait(5000); // wait for entering animation to finish

        await onDeviceOnboarding.pressHoldToConfirmButton();
        await onDeviceOnboarding.waitForWalletCreationScreen();

        await TrezorUserEnvLink.swipeEmu('up');
        await TrezorUserEnvLink.pressYes();
        await TrezorUserEnvLink.pressYes();
        await TrezorUserEnvLink.pressNo();

        // Wallet Backup Recap
        await onDeviceOnboarding.waitForWalletBackupRecapScreen();

        await onDeviceOnboarding.goToNextWalletBackupRecapStep(1);
        await onDeviceOnboarding.goToNextWalletBackupRecapStep(2);
        await onDeviceOnboarding.goToNextWalletBackupRecapStep(3);

        await onDeviceOnboarding.pressHoldToConfirmButton();

        await finishOnboardingFlow();
    });

    it('Recover Wallet', async () => {
        await onDeviceOnboarding.selectRecoverWalletOption();
        await onDeviceOnboarding.confirmRecoveryInstructions();

        // On device recovery
        await TrezorUserEnvLink.pressYes();
        await TrezorUserEnvLink.selectNumOfWordsEmu(12);
        await TrezorUserEnvLink.pressYes();
        for (let i = 0; i < 12; i++) {
            await TrezorUserEnvLink.inputEmu('all');
        }
        await TrezorUserEnvLink.pressYes();

        await onDeviceOnboarding.waitForWalletRecoveryRecapScreen();
        await onDeviceOnboarding.goToNextWalletRecoveryRecapStep(1);
        await onDeviceOnboarding.pressHoldToConfirmButton();

        await finishOnboardingFlow();
    });
});
