import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { waitForElementByIdToBeVisible } from '../utils';

class DevicePromptActions {
    async allowConnectToTrezor() {
        await waitForElementByIdToBeVisible('@screen/ThpConfirmation');
        await TrezorUserEnvLink.pressYes();
    }
}

export const onDevicePrompt = new DevicePromptActions();
