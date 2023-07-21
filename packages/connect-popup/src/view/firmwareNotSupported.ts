// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/firmwareNotSupported.js

import { UiRequestUnexpectedDeviceMode } from '@trezor/connect';
import { showView } from './common';
import { getDeviceDisplayName } from '@trezor/device-utils';

export const firmwareNotSupported = (device: UiRequestUnexpectedDeviceMode['payload']) => {
    const view = showView('firmware-not-supported');

    // showView return type has undefined in union (if react component is available);
    if (!view) {
        console.error('view does not exist!');
        return;
    }

    if (!device.features) return;

    // universal message "Coin is not supported" is replaced by
    const h3 = view.getElementsByTagName('h3')[0];

    const deviceDisplayName = getDeviceDisplayName(device.features.internal_model);
    h3.innerHTML = `${deviceDisplayName} is not supported`;
};
