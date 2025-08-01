import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import onboardingCompleted from '../fixtures/onboardingCompleted.json';
import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import {
    disconnectTrezorUserEnv,
    openApp,
    prepareTrezorEmulator,
    scrollUntilVisible,
    wait,
} from '../utils';

const proceedToCreateOrRecoverCrossroads = async () => {
    await onDeviceOnboarding.waitForUninitializedDeviceLanding();
    await onDeviceOnboarding.dismissTheUninitializedDeviceLanding();
    await onDeviceOnboarding.skipFirmwareUpdate();

    await TrezorUserEnvLink.pressYes();

    await onDeviceOnboarding.waitForDeviceAuthenticitySuccess();
    await onDeviceOnboarding.dismissDeviceAuthenticitySuccess();

    await TrezorUserEnvLink.pressYes();

    await onDeviceOnboarding.waitForCreateOrRecoverCrossroadsScreen();
};

const finishOnboardingFlow = async () => {
    // Create Pin
    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.inputEmu('123');
    await TrezorUserEnvLink.inputEmu('123');
    await TrezorUserEnvLink.pressYes();

    // Coin Enabling
    await onCoinEnabling.waitForInitScreen();
    await onCoinEnabling.toggleNetwork('btc');
    await onCoinEnabling.clickOnConfirmButton();

    await onAlertSheet.skipViewOnlyMode();

    // Check if Bitcoin is enabled
    const bitcoinNetworkElement = element(by.text('Bitcoin'));
    await scrollUntilVisible(bitcoinNetworkElement);
};

conditionalDescribe(device.getPlatform() === 'android', 'Device onboarding', () => {
    beforeEach(async () => {
        await prepareTrezorEmulator({ seed: '' });
        await openApp({ newInstance: true, args: { preloadedState: onboardingCompleted } });
        await proceedToCreateOrRecoverCrossroads();
    });

    afterEach(async () => {
        await device.uninstallApp(); // wipe app data
        await device.installApp();
    });

    afterAll(async () => {
        await disconnectTrezorUserEnv();
        await device.terminateApp();
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
