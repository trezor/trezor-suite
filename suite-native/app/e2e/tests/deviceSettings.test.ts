import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onBottomSheet } from '../pageObjects/bottomSheetActions';
import { onCoinEnablingInit } from '../pageObjects/coinEnablingActions';
import { onConnectingDevice } from '../pageObjects/connectingDevice';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onDeviceSettings } from '../pageObjects/deviceSettingsActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import {
    appIsFullyLoaded,
    disconnectTrezorUserEnv,
    openApp,
    prepareTrezorEmulator,
    restartApp,
} from '../utils';

conditionalDescribe(device.getPlatform() !== 'android', 'Device settings', () => {
    beforeAll(async () => {
        await prepareTrezorEmulator();
        await openApp({ newInstance: true });

        await onOnboarding.finishOnboarding();

        await onCoinEnablingInit.waitForScreen();
        await onCoinEnablingInit.enableNetwork('btc');
        await onCoinEnablingInit.clickOnConfirmButton();

        await onBottomSheet.skipViewOnlyMode();
    });

    beforeEach(async () => {
        await prepareTrezorEmulator();
        await restartApp();
        await appIsFullyLoaded();

        await onConnectingDevice.waitForScreen();
        await onDeviceManager.tapDeviceSwitch();
        await onDeviceManager.tapDeviceSettingsButton();
    });

    afterAll(async () => {
        disconnectTrezorUserEnv();
        await device.terminateApp();
    });

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

        await onDeviceSettings.waitForScreen();
    });
});
