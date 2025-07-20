import { conditionalDescribe } from '@suite-common/test-utils';

import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onConnectingDevice } from '../pageObjects/connectingDevice';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { redirectToDeviceAuthenticityScreenButton } from '../pageObjects/deviceSettingsActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import {
    appIsFullyLoaded,
    disconnectTrezorUserEnv,
    openApp,
    prepareTrezorEmulator,
    restartApp,
    scrollUntilVisible,
} from '../utils';

conditionalDescribe(device.getPlatform() === 'android', 'Launch Arguments', () => {
    beforeAll(async () => {
        await prepareTrezorEmulator();
        await openApp({ newInstance: true });

        await onOnboarding.skipOnboarding();

        await onCoinEnabling.waitForInitScreen();
        await onCoinEnabling.toggleNetwork('btc');

        await onCoinEnabling.clickOnConfirmButton();

        await onAlertSheet.skipViewOnlyMode();
    });

    afterAll(async () => {
        disconnectTrezorUserEnv();
        await device.terminateApp();
    });

    describe('Tests with default launch arguments', () => {
        beforeEach(async () => {
            await appIsFullyLoaded();
            await restartApp();
            await onConnectingDevice.waitForScreen();
            await onDeviceManager.tapDeviceSwitch();
            await onDeviceManager.tapDeviceSettingsButton();
        });

        test('Check backup option is visible', async () => {
            await scrollUntilVisible(redirectToDeviceAuthenticityScreenButton);

            expect(
                element(by.id('@device-check-backup/redirectToDeviceCheckBackupScreen')),
            ).toBeVisible();
        });
    });

    describe('Tests modified launch arguments', () => {
        beforeEach(async () => {
            await prepareTrezorEmulator();
            await restartApp({ args: { isCheckBackupsEnabled: false } });
            await appIsFullyLoaded();

            await onConnectingDevice.waitForScreen();
            await onDeviceManager.tapDeviceSwitch();
            await onDeviceManager.tapDeviceSettingsButton();
        });

        test('Check backup option is NOT visible', async () => {
            await scrollUntilVisible(redirectToDeviceAuthenticityScreenButton);
            expect(
                element(by.id('@device-check-backup/redirectToDeviceCheckBackupScreen')),
            ).not.toBeVisible();
        });
    });
});
