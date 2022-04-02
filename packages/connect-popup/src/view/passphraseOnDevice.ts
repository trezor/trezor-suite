// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/passphraseOnDevice.js

import { UiRequestDeviceAction } from '@trezor/connect';
import { container, showView } from './common';

export const passphraseOnDeviceView = (payload: UiRequestDeviceAction['payload']) => {
    showView('passphrase-on-device');

    const deviceName = container.getElementsByClassName('device-name')[0] as HTMLElement;
    deviceName.innerText = payload.device.label;
};
