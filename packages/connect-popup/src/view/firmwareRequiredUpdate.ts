// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/firmwareRequiredUpdate.js

import { UiRequestUnexpectedDeviceMode } from '@trezor/connect';
import { showView } from './common';

export const firmwareRequiredUpdate = (device: UiRequestUnexpectedDeviceMode['payload']) => {
    const view = showView('firmware-update');
    if (!device.features) return;
    if (!device.firmwareRelease) return;

    const button = view.getElementsByClassName('confirm')[0];
    // REF-TODO: import from constants
    button.setAttribute('href', 'https://suite.trezor.io/web/firmware/');
};
