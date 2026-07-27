import { waitForVisible } from '../support/utils';

class DeviceManagerActions {
    async tapDeviceSwitch() {
        const deviceSwitch = element(by.id('@device-manager/device-switch'));

        await waitForVisible(deviceSwitch);
        await waitFor(element(by.id('@screen/ConnectingDevice')))
            .not.toBeVisible()
            .withTimeout(30_000);
        await deviceSwitch.tap();
    }

    async tapDeviceSettingsButton() {
        const deviceSettingsButton = element(by.id('@device-manager/device-settings-button'));

        await waitForVisible(deviceSettingsButton);
        await deviceSettingsButton.tap();
    }

    async tapOpenPassphraseButton() {
        const openPassphraseButton = element(by.id('@device-manager/passphrase/add'));

        await waitForVisible(openPassphraseButton);
        await openPassphraseButton.tap();
    }

    async assertDeviceSwitcherState({
        title,
        timeout,
    }: {
        title: 'Connected' | 'Disconnected' | 'Hi there!';
        timeout?: number;
    }) {
        await waitForVisible(
            element(by.id('@device-manager/device-switch').withDescendant(by.text(title))),
            { timeout },
        );
    }
}

export const onDeviceManager = new DeviceManagerActions();
