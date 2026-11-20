import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { waitForVisible } from '../support/utils';

class DevicePromptActions {
    async allowConnectToTrezor() {
        await waitForVisible(by.id('@screen/ThpConfirmation'));
        await TrezorUserEnvLink.pressYes();
    }
}

export const onDevicePrompt = new DevicePromptActions();
