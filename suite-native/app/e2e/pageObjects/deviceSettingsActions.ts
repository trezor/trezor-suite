import { scrollUntilVisible } from '../utils';

const redirectToDeviceAuthenticityScreenButton = element(
    by.id('@device-authenticity/redirectToDeviceAuthenticityScreen'),
);

class DeviceSettingsActions {
    async waitForPinProtectionScreen() {
        await waitFor(element(by.id('@screen/PinProtection')))
            .toExist()
            .withTimeout(10000);
    }

    async waitForDeviceAuthenticityScreen() {
        await waitFor(element(by.id('@screen/DeviceAuthenticity')))
            .toExist()
            .withTimeout(10000);
    }

    async redirectToPinProtectionScreen() {
        const redirectToPinScreenButton = element(
            by.id('@device-pin-protection/redirectToPinScreen'),
        );
        await waitFor(redirectToPinScreenButton);
        await redirectToPinScreenButton.tap();
    }

    async redirectToDeviceAuthenticityScreen() {
        await waitFor(redirectToDeviceAuthenticityScreenButton);
        await redirectToDeviceAuthenticityScreenButton.tap();
    }

    async tapEnablePinProtectionButton() {
        await waitFor(element(by.id('@screen/PinProtection')));

        const enablePinProtectionButton = element(by.id('@device-pin-protection/enable-button'));
        await waitFor(enablePinProtectionButton).toBeVisible().withTimeout(10000);

        await enablePinProtectionButton.tap();
    }

    async tapChangePinProtectionButton() {
        const changePinProtectionButton = element(by.id('@device-pin-protection/change-button'));

        await waitFor(changePinProtectionButton).toBeVisible().withTimeout(10000);
        await changePinProtectionButton.tap();
    }

    async tapDisablePinProtectionButton() {
        const disablePinProtectionButton = element(by.id('@device-pin-protection/disable-button'));

        await waitFor(disablePinProtectionButton).toBeVisible().withTimeout(10000);
        await disablePinProtectionButton.tap();
    }

    async scrollUntilCheckAuthenticityButtonIsVisible() {
        await scrollUntilVisible(redirectToDeviceAuthenticityScreenButton);
    }

    async tapCheckAuthenticityButton() {
        const checkDeviceAuthenticityButton = element(by.id('@device-authenticity/check-button'));
        await waitFor(checkDeviceAuthenticityButton).toBeVisible().withTimeout(10000);
        await checkDeviceAuthenticityButton.tap();
    }
}

export const onDeviceSettings = new DeviceSettingsActions();
