// origin https://github.com/trezor/connect/blob/develop/src/js/popup/view/firmwareNotCompatible.js

import { UI, UiResponse, UiRequestUnexpectedDeviceMode } from '@trezor/connect';
import { DataManager } from '@trezor/connect/src/data/DataManager';
import { showView, postMessage } from './common';

export const firmwareNotCompatible = (device: UiRequestUnexpectedDeviceMode['payload']) => {
    const view = showView('firmware-not-compatible');
    if (!device.features) return;
    const { features } = device;

    const fwVersion = view.getElementsByClassName('fw-version')[0];
    const identity = view.getElementsByClassName('fw-identity') as HTMLCollectionOf<HTMLElement>;
    const developer =
        DataManager.getSettings('hostLabel') ||
        DataManager.getSettings('origin') ||
        'this application';
    const confirmButton = view.getElementsByClassName('confirm')[0] as HTMLButtonElement;
    const cancelButton = view.getElementsByClassName('cancel')[0] as HTMLButtonElement;

    fwVersion.innerHTML = `${features.major_version}.${features.minor_version}.${features.patch_version}`;
    for (let i = 0; i < identity.length; i++) {
        identity[i].innerText = developer;
    }

    confirmButton.onclick = () => {
        postMessage(UiResponse(UI.RECEIVE_CONFIRMATION, true));
        showView('loader');
    };

    cancelButton.onclick = () => {
        postMessage(UiResponse(UI.RECEIVE_CONFIRMATION, false));
        showView('loader');
    };
};
