// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/invalidPassphrase.js

import { UI, UiResponse, UiRequestDeviceAction } from '@trezor/connect';
import { container, showView, postMessage } from './common';

export const initInvalidPassphraseView = (_payload: UiRequestDeviceAction['payload']) => {
    showView('invalid-passphrase');

    const retryButton = container.getElementsByClassName('retry')[0] as HTMLButtonElement;
    const useCurrentButton = container.getElementsByClassName('useCurrent')[0] as HTMLButtonElement;

    retryButton.onclick = () => {
        postMessage(UiResponse(UI.INVALID_PASSPHRASE_ACTION, true));
        showView('loader');
    };

    useCurrentButton.onclick = () => {
        postMessage(UiResponse(UI.INVALID_PASSPHRASE_ACTION, false));
        showView('loader');
    };
};
