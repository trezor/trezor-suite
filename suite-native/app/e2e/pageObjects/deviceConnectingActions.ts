import { waitForVisible } from '../support/utils';

class DeviceConnectingActions {
    async waitForDeviceConnectingScreen() {
        // Connecting screen is rendered when discovery is running in the background so we need to disable synchronization to reliably test its presence
        await device.disableSynchronization();
        await waitForVisible(by.id('@screen/ConnectingDevice'));
        await device.enableSynchronization();
    }
}

export const onDeviceConnecting = new DeviceConnectingActions();
