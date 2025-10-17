class DeviceConnectingActions {
    async waitForDeviceConnectingScreen() {
        // Connecting screen is rendered when discovery is running in the background so we need to disable synchronization to reliably test its presence
        await device.disableSynchronization();
        await waitFor(element(by.id('@screen/ConnectingDevice')))
            .toBeVisible()
            .withTimeout(10000);
        await device.enableSynchronization();
    }
}

export const onDeviceConnecting = new DeviceConnectingActions();
