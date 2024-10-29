class DeviceManagerActions {
    async tapDeviceSwitch() {
        const deviceSwitch = element(by.id('@device-manager/device-switch'));

        await waitFor(deviceSwitch).toBeVisible().withTimeout(10000);
        await deviceSwitch.tap();
    }

    async tapDeviceSettingsButton() {
        const deviceSettingsButton = element(by.id('@device-manager/device-settings-button'));

        await waitFor(deviceSettingsButton).toBeVisible().withTimeout(10000);
        await deviceSettingsButton.tap();
    }
}

export const onDeviceManager = new DeviceManagerActions();
