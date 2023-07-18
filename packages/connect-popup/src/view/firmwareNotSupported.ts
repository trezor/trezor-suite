// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/firmwareNotSupported.js

import { UiRequestUnexpectedDeviceMode } from '@trezor/connect';
import { showView } from './common';
import { getDeviceDisplayName, getDeviceModel } from '@trezor/device-utils';

export const firmwareNotSupported = (device: UiRequestUnexpectedDeviceMode['payload']) => {
    const view = showView('firmware-not-supported');

    // showView return type has undefined in union (if react component is available);
    if (!view) {
        console.error('view does not exist!');
        return;
    }

    if (!device.features) return;
    const deviceModel = getDeviceModel(device);

    // universal message "Coin is not supported" is replaced by
    const h3 = view.getElementsByTagName('h3')[0];

    if (deviceModel) {
        const deviceDisplayName = getDeviceDisplayName(deviceModel);
        h3.innerHTML = `${deviceDisplayName} is not supported`;
    }
};
