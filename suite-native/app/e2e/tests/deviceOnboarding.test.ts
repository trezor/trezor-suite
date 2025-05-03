import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import {
    disconnectTrezorUserEnv,
    openApp,
    prepareTrezorEmulator,
    scrollUntilVisible,
} from '../utils';
conditionalDescribe(device.getPlatform() === 'android', 'Create Wallet', () => {
    beforeAll(async () => {
        await prepareTrezorEmulator('');

        await openApp({ newInstance: true });
    });

    afterAll(async () => {
        disconnectTrezorUserEnv();

        await device.terminateApp();
    });

    it('Should create Wallet without issues', async () => {
        await onOnboarding.skipOnboarding();

        await onDeviceOnboarding.waitForUninitializedDeviceLanding();
        await onDeviceOnboarding.dismissTheUninitializedDeviceLanding();
        await onDeviceOnboarding.skipFirmwareUpdate();

        await TrezorUserEnvLink.pressYes();

        await onDeviceOnboarding.waitForDeviceAuthenticitySuccess();
        await onDeviceOnboarding.dismissDeviceAuthenticitySuccess();

        await TrezorUserEnvLink.pressYes();

        await onDeviceOnboarding.waitForCreateOrRecoverCrossroadsScreen();
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
    });
});
