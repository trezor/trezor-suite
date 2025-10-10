import { conditionalDescribe } from '@suite-common/test-utils';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedStateT1B1 } from '../fixtures/regtestDiscoveryFinishedStateT1B1';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onDeviceSettings } from '../pageObjects/deviceSettingsActions';
import {
    appIsFullyLoaded,
    openApp,
    preparePreloadedReduxState,
    prepareTrezorEmulator,
} from '../utils';

const preloadedStateT1B1 = preparePreloadedReduxState(
    onboardingCompletedState,
    regtestDiscoveryFinishedStateT1B1,
);

conditionalDescribe(
    device.getPlatform() === 'android',
    'Device Settings - Tests with T1B1 device model [@specificModel]',
    () => {
        beforeEach(async () => {
            await openApp({ args: { preloadedState: preloadedStateT1B1 } });
            await prepareTrezorEmulator({ model: 'T1B1' });
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
    },
);
