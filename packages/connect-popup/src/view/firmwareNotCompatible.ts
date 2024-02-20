// origin https://github.com/trezor/connect/blob/develop/src/js/popup/view/firmwareNotCompatible.js

import { UI, createUiResponse, UiRequestUnexpectedDeviceMode } from '@trezor/connect';
import { showView, postMessage, getState } from './common';
import { getFirmwareVersion } from '@trezor/device-utils';

export const firmwareNotCompatible = (device: UiRequestUnexpectedDeviceMode['payload']) => {
    const view = showView('firmware-not-compatible');

    // showView return type has undefined in union (if react component is available);
    if (!view) {
        console.error('view does not exist!');

        return;
    }

    if (!device.features) return;

    const fwVersion = view.getElementsByClassName('fw-version')[0];
    const identity = view.getElementsByClassName('fw-identity') as HTMLCollectionOf<HTMLElement>;
    const { settings } = getState();
    const developer = settings?.hostLabel ?? settings?.origin ?? 'this application';
    const confirmButton = view.getElementsByClassName('confirm')[0] as HTMLButtonElement;
    const cancelButton = view.getElementsByClassName('cancel')[0] as HTMLButtonElement;

    fwVersion.innerHTML = getFirmwareVersion(device);
    for (let i = 0; i < identity.length; i++) {
        identity[i].innerText = developer;
    }

    confirmButton.onclick = () => {
        postMessage(createUiResponse(UI.RECEIVE_CONFIRMATION, true));
        showView('loader');
    };

    cancelButton.onclick = () => {
        postMessage(createUiResponse(UI.RECEIVE_CONFIRMATION, false));
        showView('loader');
    };
};
