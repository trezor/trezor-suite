// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/firmwareRequiredUpdate.js

import { UiRequestUnexpectedDeviceMode } from '@trezor/connect';
import { SUITE_FIRMWARE_URL } from '@trezor/urls';
import { showView } from './common';

export const firmwareRequiredUpdate = (device: UiRequestUnexpectedDeviceMode['payload']) => {
    const view = showView('firmware-update');
    if (!device.features) return;
    if (!device.firmwareRelease) return;

    // showView return type has undefined in union (if react component is available);
    if (!view) {
        console.error('view does not exist!');

        return;
    }

    const button = view.getElementsByClassName('confirm')[0];

    button.setAttribute('href', SUITE_FIRMWARE_URL);
};
