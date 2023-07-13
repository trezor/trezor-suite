// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/firmwareNotSupported.js

import { UiRequestUnexpectedDeviceMode } from '@trezor/connect';
import { showView } from './common';
import { DeviceModel, getDeviceModel } from '@trezor/device-utils';

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

    // TODO: T2B1 translation string
    if (deviceModel) {
        let deviceString = '';

        switch (deviceModel) {
            case DeviceModel.T1:
                deviceString = 'Trezor Model One';
                break;
            case DeviceModel.TT:
                deviceString = 'Trezor Model T';
                break;
            case DeviceModel.T2B1:
                deviceString = 'Trezor Model R';
                break;
            // no default
        }
        h3.innerHTML = `${deviceString} is not supported`;
    }
};
