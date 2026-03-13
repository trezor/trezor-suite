import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedStateT3T1 } from '../fixtures/regtestDiscoveryFinishedStateT3T1';
import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onDeviceAuthenticitySuccess } from '../pageObjects/deviceAuthenticitySuccess';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onDeviceSettings } from '../pageObjects/deviceSettingsActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { waitForVisible } from '../support/utils';

const preloadedStateT3T1 = preparePreloadedReduxState(
    onboardingCompletedState,
    regtestDiscoveryFinishedStateT3T1,
);

describe('Device settings T3T1 [@androidOnly @smoke @T3T1]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState: preloadedStateT3T1 } });
        await prepareTrezorEmulator({ model: Model.T3T1 });
        await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });
        await onDeviceManager.tapDeviceSwitch();
        await onDeviceManager.tapDeviceSettingsButton();
    });

    // Firmware 2.9.4 brought instability in firmware/emu interaction, this will be discussed with firmware team
    // We would have to put wait(500) in each step interacting with emulator
    test('Enable, change & disable PIN', async () => {
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
        await waitForVisible(by.text('new name'));
    });

    test('Wipe device', async () => {
        await onDeviceSettings.tapWipeDevice();
        await onDeviceSettings.confirmStepperItems(2);
        await onDeviceSettings.waitForWipeDeviceContinueOnTrezor();
        await TrezorUserEnvLink.pressNo();
        await onDeviceSettings.confirmStepperItems(1);
        await TrezorUserEnvLink.pressYes();
        await onDeviceSettings.waitForHomeScreenAndUninitializedTitle();
    });

    test('Device Check Backup', async () => {
        await onDeviceSettings.tapDeviceCheckBackupButton();
        await onDeviceSettings.passCheckBackupFlow();
    });
});
