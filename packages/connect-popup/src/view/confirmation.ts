// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/confirmation.js

import { UI, UiResponse, UiRequestConfirmation } from '@trezor/connect';
import { container, showView, postMessage } from './common';

export const initConfirmationView = (data: UiRequestConfirmation['payload']) => {
    // Confirmation views:
    // - export xpub
    // - export account info
    // - no backup

    // TODO: Check if correct class names for HTML views
    showView(data.view);

    const h3 = container.getElementsByTagName('h3')[0];
    const confirmButton = container.getElementsByClassName('confirm')[0] as HTMLButtonElement;
    const cancelButton = container.getElementsByClassName('cancel')[0] as HTMLButtonElement;

    const { label, customConfirmButton, customCancelButton } = data;
    if (customConfirmButton) {
        confirmButton.innerText = customConfirmButton.label;
        confirmButton.classList.add(customConfirmButton.className);
    }
    if (customCancelButton) {
        confirmButton.innerText = customCancelButton.label;
        confirmButton.classList.add(customCancelButton.className);
    }

    if (label) {
        h3.innerHTML = label;
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
