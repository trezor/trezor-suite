class DeviceConnectingActions {
    async waitForDeviceConnectingScreen() {
        await waitFor(element(by.id('@screen/ConnectingDevice')))
            .toBeVisible()
            .withTimeout(10000);
    }
}

export const onDeviceConnecting = new DeviceConnectingActions();
