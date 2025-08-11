import { conditionalDescribe } from '@suite-common/test-utils';

import { onboardingCompleted } from '../fixtures/onboardingCompleted';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { redirectToDeviceAuthenticityScreenButton } from '../pageObjects/deviceSettingsActions';
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
        await openApp({ newInstance: true, args: { preloadedState: onboardingCompleted } });

        await onCoinEnabling.waitForInitScreen();
        await onCoinEnabling.toggleNetwork('btc');

        await onCoinEnabling.clickOnConfirmButton();
    });

    afterAll(async () => {
        await disconnectTrezorUserEnv();
        await device.terminateApp();
    });

    describe('Tests with default launch arguments', () => {
        beforeEach(async () => {
            await appIsFullyLoaded();
            await restartApp();
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
