// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/browser.js

import { config } from '@trezor/connect/src/data/config';
import { getBrowserState } from '@trezor/connect/src/utils/browserUtils'; // TODO: https://github.com/trezor/trezor-suite/issues/5324
import { storage } from '@trezor/connect-common';
import { container, showView } from './common';

const validateBrowser = () => {
    const state = getBrowserState(config.supportedBrowsers);
    if (!state.supported) {
        const permitted = storage.load().browser;
        return !permitted ? state : null;
    }
};

export const initBrowserView = (validation = true): Promise<boolean> => {
    if (!validation) {
        showView('browser-not-supported');
        const buttons = container.getElementsByClassName('buttons')[0];
        if (buttons && buttons.parentNode) {
            buttons.parentNode.removeChild(buttons);
        }
        return Promise.resolve(false);
    }
    const state = validateBrowser();
    if (!state) {
        return Promise.resolve(true);
    }
    if (state.mobile) {
        showView('smartphones-not-supported');
        return Promise.resolve(false);
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

    return new Promise(resolve => {
        ackButton.onclick = () => {
            if (rememberCheckbox && rememberCheckbox.checked) {
                storage.save(state => ({
                    ...state,
                    browser: true,
                }));
            }
            showView('loader');
            resolve(true);
        };
    });
};
