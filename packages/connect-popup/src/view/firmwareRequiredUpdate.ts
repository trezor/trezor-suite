// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/firmwareRequiredUpdate.js

import { UiRequestUnexpectedDeviceMode } from '@trezor/connect';
import { showView } from './common';
import { SUITE_FIRMWARE } from '../urls';

export const firmwareRequiredUpdate = (device: UiRequestUnexpectedDeviceMode['payload']) => {
    const view = showView('firmware-update');
    if (!device.features) return;
    if (!device.firmwareRelease) return;

    const button = view.getElementsByClassName('confirm')[0];

    button.setAttribute('href', SUITE_FIRMWARE);
};
