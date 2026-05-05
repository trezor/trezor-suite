import { Model } from '@trezor/trezor-user-env-link';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedStateT1B1 } from '../fixtures/regtestDiscoveryFinishedStateT1B1';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onDeviceSettings } from '../pageObjects/deviceSettingsActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { waitForVisible } from '../support/utils';

const preloadedStateT1B1 = preparePreloadedReduxState(
    onboardingCompletedState,
    regtestDiscoveryFinishedStateT1B1,
);

describe('Device Settings T1B1 [@androidOnly @T1B1]', () => {
    beforeEach(async () => {
        await prepareTrezorEmulator({ model: Model.T1B1 });
        await openApp({ args: { preloadedState: preloadedStateT1B1 } });
        await onDeviceManager.tapDeviceSwitch();
        await onDeviceManager.tapDeviceSettingsButton();
    });

    test('Device Check Backup with unsupported Device Model', async () => {
        await onDeviceSettings.tapDeviceCheckBackupButton();
        await waitForVisible(by.text('To check your backup, use the web application.'));
    });
});
