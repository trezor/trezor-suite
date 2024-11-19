class DeviceAuthenticitySummary {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/AuthenticitySummary')))
            .toBeVisible()
            .withTimeout(10000);
    }

    async tapCloseButton() {
        const closeButton = element(by.id('@device-authenticity/close-button'));

        await waitFor(closeButton).toBeVisible().withTimeout(10000);
        await closeButton.tap();
    }
}

export const onDeviceAuthenticitySummary = new DeviceAuthenticitySummary();
