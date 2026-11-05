import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { waitForVisible } from '../support/utils';

class DeviceConnectingActions {
    async waitForDeviceConnectingScreen() {
        // Connecting screen is rendered when discovery is running in the background so we need to disable synchronization to reliably test its presence
        await device.disableSynchronization();
        await waitForVisible(by.id('@screen/ConnectingDevice'));
        await device.enableSynchronization();
    }

    async stopEmuAndConfirmViewOnlyWarning() {
        await TrezorUserEnvLink.stopEmu();
        await waitForVisible(by.id('@home/alert/view-only'));
        await element(by.text('Got it')).tap();
    }
}

export const onDeviceConnecting = new DeviceConnectingActions();
