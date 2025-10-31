import { waitForVisible } from '../support/utils';

class DeviceAuthenticitySuccess {
    async waitForScreen() {
        await waitForVisible(by.id('@screen/AuthenticitySuccess'));
    }

    async tapCloseButton() {
        const closeButton = element(by.id('@device-authenticity/close-button'));

        await waitForVisible(closeButton);
        await closeButton.tap();
    }
}

export const onDeviceAuthenticitySuccess = new DeviceAuthenticitySuccess();
