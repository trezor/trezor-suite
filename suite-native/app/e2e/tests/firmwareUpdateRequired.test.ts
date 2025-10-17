import { conditionalDescribe } from '@suite-common/test-utils';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedStateT3T1 } from '../fixtures/regtestDiscoveryFinishedStateT3T1';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onDeviceSettings } from '../pageObjects/deviceSettingsActions';
import {
    appIsFullyLoaded,
    openApp,
    preparePreloadedReduxState,
    prepareTrezorEmulator,
} from '../utils';

const preloadedStateT3T1 = preparePreloadedReduxState(
    onboardingCompletedState,
    regtestDiscoveryFinishedStateT3T1,
);

conditionalDescribe(device.getPlatform() === 'android', 'Device settings', () => {
    describe('Tests with FW update required [@specificModel]', () => {
        beforeEach(async () => {
            await openApp({ args: { preloadedState: preloadedStateT3T1 } });
            await prepareTrezorEmulator({
                version: '2.8.9',
                args: { isFirmwareUpdateEnabled: true },
            });
            await appIsFullyLoaded();
        });

        test('Device Check Backup is possible from firmware update', async () => {
            await onDeviceManager.tapDeviceSwitch();
            await onDeviceManager.tapDeviceSettingsButton();
            await onDeviceSettings.tapUpdateFirmwareButton();
            await onDeviceSettings.tapUpdateFirmwareBottomSheet();
            await onDeviceSettings.tapCheckBackupButtonFromFirmwareUpdate();

            await onDeviceSettings.passCheckBackupFlow();
        });
    });
});
