class ConnectingDeviceActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/ConnectingDevice')))
            .toBeVisible()
            .withTimeout(10000);
    }
}

export const onConnectingDevice = new ConnectingDeviceActions();
