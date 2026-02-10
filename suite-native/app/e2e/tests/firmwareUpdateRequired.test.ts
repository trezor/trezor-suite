import { conditionalDescribe } from '@suite-common/test-utils';

import { initialDeviceDataState } from '../fixtures/initialDeviceDataState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedStateT3T1 } from '../fixtures/regtestDiscoveryFinishedStateT3T1';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onDeviceSettings } from '../pageObjects/deviceSettingsActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';

const preloadedStateT3T1 = preparePreloadedReduxState(
    initialDeviceDataState,
    onboardingCompletedState,
    regtestDiscoveryFinishedStateT3T1,
);

conditionalDescribe(
    device.getPlatform() === 'android',
    'FW update required [@specificModel]',
    () => {
        beforeEach(async () => {
            await openApp({ args: { preloadedState: preloadedStateT3T1 } });
            await prepareTrezorEmulator({
                version: '2.8.9',
                args: { isFirmwareUpdateEnabled: true },
            });
        });

        test('Device Check Backup is possible from firmware update', async () => {
            await onDeviceManager.tapDeviceSwitch();
            await onDeviceManager.tapDeviceSettingsButton();
            await onDeviceSettings.tapUpdateFirmwareButton();
            await onDeviceSettings.tapUpdateFirmwareBottomSheet();
            await onDeviceSettings.tapCheckBackupButtonFromFirmwareUpdate();

            await onDeviceSettings.passCheckBackupFlow();
        });
    },
);
