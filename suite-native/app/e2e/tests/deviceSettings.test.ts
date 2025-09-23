import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedState } from '../fixtures/regtestDiscoveryFinishedState';
import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onDeviceAuthenticitySuccess } from '../pageObjects/deviceAuthenticitySuccess';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onDeviceSettings } from '../pageObjects/deviceSettingsActions';
import {
    appIsFullyLoaded,
    disconnectTrezorUserEnv,
    mergePreloadedReduxState,
    openApp,
    prepareTrezorEmulator,
    restartApp,
    wipeAppData,
} from '../utils';

const preloadedState = mergePreloadedReduxState(
    onboardingCompletedState,
    regtestDiscoveryFinishedState,
);

conditionalDescribe(device.getPlatform() === 'android', 'Device settings', () => {
    beforeAll(async () => {
        await openApp({ newInstance: true, args: { preloadedState } });
        await appIsFullyLoaded();
    });

    afterAll(async () => {
        await disconnectTrezorUserEnv();
        await device.terminateApp();
    });

    afterEach(async () => {
        await TrezorUserEnvLink.stopEmu();
    });

    describe('Tests with T3T1 device model [@specificModel]', () => {
        beforeEach(async () => {
            await prepareTrezorEmulator({ model: 'T3T1' });
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

            await onDeviceSettings.waitForHomeScreenAndUninitializedTitle();
        });

        test('Device Check Backup', async () => {
            await onDeviceSettings.tapDeviceCheckBackupButton();

            await onDeviceSettings.passCheckBackupFlow();
        });
    });

    describe('Tests with FW update required', () => {
        beforeEach(async () => {
            await prepareTrezorEmulator({ version: '2.8.9' });
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
        });
    });
});

conditionalDescribe(
    device.getPlatform() === 'android',
    'Device Settings - Tests with T1B1 device model [@specificModel]',
    () => {
        beforeAll(async () => {
            // state of previous tests with remembered state need to be wiped
            await disconnectTrezorUserEnv();
            await wipeAppData();

            await openApp({
                newInstance: true,
                args: { preloadedState },
            });
            await appIsFullyLoaded();

            await prepareTrezorEmulator({ model: 'T1B1' });
            await restartApp();
            await appIsFullyLoaded();

            await onDeviceManager.tapDeviceSwitch();
            await onDeviceManager.tapDeviceSettingsButton();
        });

        afterAll(async () => {
            await disconnectTrezorUserEnv();
            await device.terminateApp();
        });

        test('Device Check Backup with unsupported Device Model', async () => {
            await onDeviceSettings.tapDeviceCheckBackupButton();

            await waitFor(element(by.text('To check your backup, use the web application.')))
                .toBeVisible()
                .withTimeout(10000);
        });
    },
);
