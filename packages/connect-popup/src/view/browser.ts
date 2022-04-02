// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/browser.js

import { POPUP, UiResponse } from '@trezor/connect';
import { config } from '@trezor/connect/src/data/config';
import { getBrowserState } from '@trezor/connect/src/utils/browserUtils';
import * as storage from '@trezor/connect-common/src/storage';
import { container, showView, postMessage } from './common';

const validateBrowser = () => {
    const state = getBrowserState(config.supportedBrowsers);
    if (!state.supported) {
        const permitted = storage.load(storage.BROWSER_KEY);
        return !permitted ? state : null;
    }
};

export const initBrowserView = (validation = true) => {
    if (!validation) {
        showView('browser-not-supported');
        const buttons = container.getElementsByClassName('buttons')[0];
        if (buttons && buttons.parentNode) {
            buttons.parentNode.removeChild(buttons);
        }
        return;
    }
    const state = validateBrowser();
    if (!state) {
        postMessage(UiResponse(POPUP.HANDSHAKE));
        return;
    }
    if (state.mobile) {
        showView('smartphones-not-supported');
        return;
    }

    showView('browser-not-supported');

    const h3 = container.getElementsByTagName('h3')[0];
    const ackButton = container.getElementsByClassName('cancel')[0] as HTMLButtonElement;
    const rememberCheckbox = container.getElementsByClassName(
        'remember-permissions',
    )[0] as HTMLInputElement;

    if (state.outdated) {
        h3.innerText = 'Outdated browser';
    }

    ackButton.onclick = () => {
        if (rememberCheckbox && rememberCheckbox.checked) {
            storage.save(storage.BROWSER_KEY, true);
        }

        postMessage(UiResponse(POPUP.HANDSHAKE));
        showView('loader');
    };
};
