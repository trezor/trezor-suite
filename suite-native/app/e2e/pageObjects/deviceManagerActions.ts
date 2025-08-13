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

    async assertDeviceSwitcherState({
        title,
    }: {
        title: 'Connected' | 'Disconnected' | 'Hi there!';
    }) {
        await waitFor(
            element(by.id('@device-manager/device-switch').withDescendant(by.text(title))),
        )
            .toBeVisible()
            .withTimeout(10000);
    }
}

export const onDeviceManager = new DeviceManagerActions();
