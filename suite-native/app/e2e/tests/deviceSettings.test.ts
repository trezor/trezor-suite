import { conditionalDescribe } from '@suite-common/test-utils';
import { MNEMONICS, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onboardingCompleted } from '../fixtures/onboardingCompleted';
import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceAuthenticitySuccess } from '../pageObjects/deviceAuthenticitySuccess';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onDeviceSettings } from '../pageObjects/deviceSettingsActions';
import {
    PrepareTrezorEmulatorProps,
    appIsFullyLoaded,
    disconnectTrezorUserEnv,
    openApp,
    prepareTrezorEmulator,
    restartApp,
} from '../utils';

const defaultEmulatorOptions: PrepareTrezorEmulatorProps = { seed: MNEMONICS.mnemonic_all };

conditionalDescribe(device.getPlatform() === 'android', 'Device settings', () => {
    beforeAll(async () => {
        await prepareTrezorEmulator(defaultEmulatorOptions);
        await openApp({ newInstance: true, args: { preloadedState: onboardingCompleted } });

        await onCoinEnabling.waitForInitScreen();
        await onCoinEnabling.toggleNetwork('btc');
        await onCoinEnabling.clickOnConfirmButton();
    });

    afterAll(async () => {
        await disconnectTrezorUserEnv();
        await device.terminateApp();
    });

    describe('Tests with T3T1 device model', () => {
        beforeEach(async () => {
            await prepareTrezorEmulator(defaultEmulatorOptions);
            await restartApp();
            await appIsFullyLoaded();

            await onDeviceManager.tapDeviceSwitch();
            await onDeviceManager.tapDeviceSettingsButton();
        });

        test('Enable, change & disable PIN', async () => {
            await onDeviceSettings.redirectToPinProtectionScreen();

            await onDeviceSettings.tapEnablePinProtectionButton();
            await TrezorUserEnvLink.pressNo();
            await onAlertSheet.tapPrimaryButton();
            await TrezorUserEnvLink.pressYes();
            await TrezorUserEnvLink.inputEmu('42');
            await TrezorUserEnvLink.inputEmu('42');
            await TrezorUserEnvLink.pressYes();

            await onDeviceSettings.tapChangePinProtectionButton();
            await TrezorUserEnvLink.pressNo();
            await onAlertSheet.tapSecondaryButton();

            await onDeviceSettings.tapChangePinProtectionButton();
            await TrezorUserEnvLink.pressYes();
            await TrezorUserEnvLink.inputEmu('42');
            await TrezorUserEnvLink.inputEmu('21');
            await TrezorUserEnvLink.inputEmu('21');
            await TrezorUserEnvLink.pressYes();

            await onDeviceSettings.tapDisablePinProtectionButton();
            await TrezorUserEnvLink.pressYes();
            await TrezorUserEnvLink.inputEmu('21');
            await TrezorUserEnvLink.pressYes();

            await onDeviceSettings.waitForPinProtectionScreen();
        });

        test('Check device authenticity', async () => {
            await onDeviceSettings.redirectToDeviceAuthenticityScreen();

            await onDeviceSettings.tapCheckAuthenticityButton();
            await TrezorUserEnvLink.pressNo();

            await onDeviceSettings.tapCheckAuthenticityButton();
            await TrezorUserEnvLink.pressYes();

            await onDeviceAuthenticitySuccess.waitForScreen();
            await onDeviceAuthenticitySuccess.tapCloseButton();

            await onDeviceSettings.waitForDeviceAuthenticityScreen();
        });

        test('Change Device Name', async () => {
            await onDeviceSettings.tapChangeDeviceNameButton();
            await onDeviceSettings.submitNewDeviceName('new name');
            await TrezorUserEnvLink.pressYes();

            await onDeviceSettings.waitForSettingsScreen();

            await waitFor(element(by.text('new name')))
                .toBeVisible()
                .withTimeout(10000);
        });

        test('Wipe device', async () => {
            await onDeviceSettings.tapWipeDevice();

            await onDeviceSettings.confirmStepperItems(2);
            await onDeviceSettings.waitForWipeDeviceContinueOnTrezor();
            await TrezorUserEnvLink.pressNo();
            await onDeviceSettings.confirmStepperItems(1);
            await TrezorUserEnvLink.pressYes();

            await onDeviceSettings.waitForHomescreenAndUninitializedTitle();
        });

        test('Device Check Backup', async () => {
            await onDeviceSettings.tapDeviceCheckBackupButton();

            await onDeviceSettings.passCheckBackupFlow();

            await waitFor(element(by.text('Your backup is valid')))
                .toBeVisible()
                .withTimeout(10000);
        });
    });

    describe('Tests with FW update required', () => {
        beforeEach(async () => {
            await prepareTrezorEmulator({ ...defaultEmulatorOptions, version: '2.8.9' });
            await restartApp({ args: { isFirmwareUpdateEnabled: true } });
            await appIsFullyLoaded();

            await onDeviceManager.tapDeviceSwitch();
            await onDeviceManager.tapDeviceSettingsButton();
        });

        test('Device Check Backup is possible from firmware update', async () => {
            await onDeviceSettings.tapUpdateFirmwareButton();
            await onDeviceSettings.tapUpdateFirmwareBottomSheet();
            await onDeviceSettings.tapCheckBackupButtonFromFirmwareUpdate();

            await onDeviceSettings.passCheckBackupFlow();
            await waitFor(element(by.text('Your backup is valid')))
                .toBeVisible()
                .withTimeout(10000);
        });
    });

    describe('Tests with T1B1 device model', () => {
        beforeEach(async () => {
            await prepareTrezorEmulator({ ...defaultEmulatorOptions, model: 'T1B1' });
            await restartApp();
            await appIsFullyLoaded();

            await onDeviceManager.tapDeviceSwitch();
            await onDeviceManager.tapDeviceSettingsButton();
        });

        test('Device Check Backup with unsupported Device Model', async () => {
            await onDeviceSettings.tapDeviceCheckBackupButton();

            await waitFor(element(by.text('To check your backup, use the web application.')))
                .toBeVisible()
                .withTimeout(10000);
        });
    });
});
