class DeviceManagerActions {
    async tapDeviceSwitch() {
        const deviceSwitch = element(by.id('@device-manager/device-switch'));

        await waitFor(deviceSwitch).toBeVisible().withTimeout(30000);
        await deviceSwitch.tap();
    }

    async tapDeviceSettingsButton() {
        const deviceSettingsButton = element(by.id('@device-manager/device-settings-button'));

        await waitFor(deviceSettingsButton).toBeVisible().withTimeout(30000);
        await deviceSettingsButton.tap();
    }

    async tapOpenPassphraseButton() {
        const openPassphraseButton = element(by.id('@device-manager/passphrase/add'));

        await waitFor(openPassphraseButton).toBeVisible().withTimeout(30000);
        await openPassphraseButton.tap();
    }
}

export const onDeviceManager = new DeviceManagerActions();
